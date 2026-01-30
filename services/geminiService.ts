
import { GoogleGenAI } from "@google/genai";
import { ComparisonResult, SimulationResult, SimulationRule, ExpectedResultQuery, Language, AIChatResponse, AppState, CustomProductModel, CustomProductDatabase } from "../types";

// Default Fallbacks if nothing is saved
const DEFAULTS = {
  gemini: { model: 'gemini-2.0-flash-exp', baseURL: '' },
  chatgpt: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o' },
  deepseek: { baseURL: 'https://api.deepseek.com', model: 'deepseek-chat' },
  qwen: { baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  doubao: { baseURL: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-pro-4k' },
  claude: { baseURL: 'https://api.anthropic.com/v1/messages', model: 'claude-3-5-sonnet-20240620' }
};

const getConfig = () => {
  const activeProvider = localStorage.getItem('inducomp_active_provider') || 'gemini';
  const savedConfigsStr = localStorage.getItem('inducomp_provider_configs');
  
  let apiKey = '';
  let baseURL = '';
  let model = '';

  if (savedConfigsStr) {
      try {
          const configs = JSON.parse(savedConfigsStr);
          const currentConfig = configs[activeProvider];
          if (currentConfig) {
              apiKey = currentConfig.apiKey;
              baseURL = currentConfig.baseURL;
              model = currentConfig.model;
          }
      } catch (e) { console.error("Config parse error", e); }
  } else {
      // Fallback to legacy key storage check if full config missing
      const oldKeysStr = localStorage.getItem('inducomp_api_keys');
      if (oldKeysStr) {
          try {
              const oldKeys = JSON.parse(oldKeysStr);
              apiKey = oldKeys[activeProvider];
          } catch(e) {}
      }
  }

  // Apply Defaults if fields are empty
  if (!baseURL && DEFAULTS[activeProvider as keyof typeof DEFAULTS]) {
      baseURL = DEFAULTS[activeProvider as keyof typeof DEFAULTS].baseURL;
  }
  if (!model && DEFAULTS[activeProvider as keyof typeof DEFAULTS]) {
      model = DEFAULTS[activeProvider as keyof typeof DEFAULTS].model;
  }

  // Env Var fallback for Gemini only
  if (!apiKey && activeProvider === 'gemini' && typeof process !== 'undefined' && process.env.API_KEY) {
    apiKey = process.env.API_KEY;
  }

  return { provider: activeProvider, apiKey, baseURL, model };
};

// Robust JSON Extractor
const extractJSON = (text: string): any => {
  if (!text) throw new Error("API returned empty response");

  let jsonString = text;
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = text.match(codeBlockRegex);
  if (match) {
    jsonString = match[1];
  }

  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  }

  // REPAIR: Fix common AI JSON errors
  jsonString = jsonString.replace(/"url":\s*"https:\s*[\r\n]/g, '"url": "",\n');
  jsonString = jsonString.replace(/"url":\s*"https:\s*(?=")/g, '"url": "",');
  jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    try {
        console.warn("Initial JSON parse failed, attempting aggressive cleanup...");
        const cleaned = jsonString
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/[\n\r\t]/g, ' ');
        return JSON.parse(cleaned);
    } catch (e2) {
        console.error("Failed JSON Body:", jsonString);
        throw new Error("Failed to parse AI response. The model might have returned invalid JSON.");
    }
  }
};

// --- API CLIENTS ---

const callOpenAICompatible = async (apiKey: string, baseURL: string, model: string, systemPrompt: string, userPrompt: string, jsonMode = true) => {
  // Ensure baseURL does not end with slash
  const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  const body: any = {
    model: model,
    messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ],
    temperature: 0.2,
    max_tokens: 4096
  };

  if (jsonMode) {
      body.response_format = { type: 'json_object' };
  }

  // Construct URL. Some providers need /chat/completions, some might include it in BaseURL.
  // Standard convention: BaseURL is host/v1, we append /chat/completions
  // But if user typed full path, we should handle it. 
  const endpoint = cleanBaseURL.includes('chat/completions') ? cleanBaseURL : `${cleanBaseURL}/chat/completions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Provider API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return extractJSON(data.choices[0]?.message?.content || "");
};

const callAnthropic = async (apiKey: string, baseURL: string, model: string, systemPrompt: string, userPrompt: string) => {
  const response = await fetch(baseURL || 'https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerously-allow-browser': 'true' 
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return extractJSON(data.content[0]?.text || "");
};

// --- SERVICE FUNCTIONS ---

export const compareProducts = async (
    modelA: string, 
    modelB: string, 
    lang: Language,
    localDataA?: CustomProductModel,
    localDataB?: CustomProductModel
): Promise<ComparisonResult> => {
  const { provider, apiKey, baseURL, model } = getConfig();
  
  if (!apiKey) {
      throw new Error(`Missing API Key for ${provider}. Please configure it in Settings.`);
  }

  const langText = 'Simplified Chinese (简体中文)'; 

  let schemaInstruction = "";
  let localDataContext = "";

  if (localDataA || localDataB) {
      const source = localDataA || localDataB;
      const indexes = source!.indexes.map(i => i.name);
      schemaInstruction = `Compare using these EXACT parameters from local DB: ${JSON.stringify(indexes)}`;
      if (localDataA) localDataContext += `\nModel A Local Data: ${JSON.stringify(localDataA.indexes)}`;
      if (localDataB) localDataContext += `\nModel B Local Data: ${JSON.stringify(localDataB.indexes)}`;
  } else {
      schemaInstruction = "Compare using 8 standard technical parameters relevant to these specific products.";
  }

  const systemInstructions = `
      You are a specialized Industrial Comparison Engine.
      Target Language: ${langText}.
      Task: Compare ${modelA} vs ${modelB}.
      Rules:
      1. Identify product category.
      2. ${schemaInstruction}
      3. Provide realistic, factual data. DO NOT HALLUCINATE.
      4. Output STRICT JSON format.
  `;

  const userPrompt = `Compare ${modelA} and ${modelB}. ${localDataContext}
  
  Required JSON Structure:
  {
      "productA": { "category": "String", "pros": ["String"], "cons": ["String"], "summary": "String" },
      "productB": { "category": "String", "pros": ["String"], "cons": ["String"], "summary": "String" },
      "sharedSpecs": [ { "name": "Spec Name", "valueA": "Value", "valueB": "Value", "winner": "A"|"B"|"Tie" } ],
      "differences": ["String"],
      "powerWinner": "A"|"B"|"Tie",
      "efficiencyWinner": "A"|"B"|"Tie",
      "verdict": "Conclusion",
      "recommendedRules": [ { "id": "1", "name": "Rule", "value": "100", "unit": "%" } ],
      "recommendedQueries": [ { "id": "1", "query": "Question?" } ],
      "warning": { "type": "NONE"|"CATEGORY_MISMATCH", "message": "String" }
  }`;

  try {
      if (provider === 'gemini') {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
              model: model, // User defined model
              contents: userPrompt,
              config: {
                  systemInstruction: systemInstructions,
                  temperature: 0.2,
                  tools: [{googleSearch: {}}],
              }
          });
          if (!response.text) throw new Error("Gemini returned empty response");
          return extractJSON(response.text);
      } 
      
      if (provider === 'claude') {
          return await callAnthropic(apiKey, baseURL, model, systemInstructions, userPrompt);
      }

      // Handle OpenAI Compatible (DeepSeek, ChatGPT, Qwen, Doubao)
      if (!baseURL) throw new Error(`Provider ${provider} is missing Base URL. Please check Settings.`);
      return await callOpenAICompatible(apiKey, baseURL, model, systemInstructions, userPrompt);

  } catch (error: any) {
      console.error("Comparison Service Error:", error);
      throw new Error(`Comparison Failed: ${error.message}`);
  }
};

export const runSimulation = async (
  modelA: string,
  modelB: string,
  rules: SimulationRule[],
  expectations: ExpectedResultQuery[],
  lang: Language
): Promise<SimulationResult> => {
  const { provider, apiKey, baseURL, model } = getConfig();

  if (!apiKey) throw new Error(`Missing API Key for ${provider}.`);

  const langText = 'Simplified Chinese (简体中文)';
  const rulesText = rules.map(r => `${r.name}: ${r.value} ${r.unit}`).join('\n');
  const questionsText = expectations.map(e => e.query).join('\n');

  const systemInstructions = `
      Role: Industrial Simulation Engine.
      Target Language: ${langText}.
      Objective: Simulate ${modelA} vs ${modelB}.
      Instructions: 
      1. Adapt metrics to product type. 
      2. Generate ~10 timeline events. 
      3. CRITICAL: Ensure continuous tracking of key metrics (e.g. Load, Temp, Cost) across multiple events to show trends. Do not just use isolated metrics.
      4. Output STRICT JSON.
  `;

  const userPrompt = `
      [Models]: ${modelA} vs ${modelB}
      [Conditions]: ${rulesText}
      [Queries]: ${questionsText}
      
      Required JSON:
      {
        "summary": "String",
        "period": "String",
        "questionAnswers": [ { "question": "String", "answer": "String" } ],
        "kpis": [ { "name": "String", "valueA": "Val", "valueB": "Val", "unit": "U", "winner": "A" } ],
        "timelineEvents": [
          { "time": "T1", "description": "Desc", "metrics": { "Metric1": { "A": 1, "B": 2, "unit": "U" } } }
        ],
        "userComments": [ { "user": "User", "comment": "String", "source": "Source", "url": "", "sentiment": "Positive" } ]
      }
  `;

  try {
    let result: SimulationResult;

    if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: model,
            contents: userPrompt,
            config: {
                systemInstruction: systemInstructions,
                temperature: 0.3,
                tools: [{googleSearch: {}}],
            }
        });
        if (!response.text) throw new Error("Gemini returned empty response");
        result = extractJSON(response.text);
    } else if (provider === 'claude') {
        result = await callAnthropic(apiKey, baseURL, model, systemInstructions, userPrompt);
    } else {
        if (!baseURL) throw new Error(`Provider ${provider} is missing Base URL.`);
        result = await callOpenAICompatible(apiKey, baseURL, model, systemInstructions, userPrompt);
    }

    result.usedRules = rules;
    return result;

  } catch (error: any) {
      console.error("Simulation Service Error:", error);
      throw new Error(`Simulation Failed: ${error.message}`);
  }
};

export const parseProductManual = async (text: string, lang: Language): Promise<CustomProductDatabase> => {
    const { provider, apiKey, baseURL, model } = getConfig();
    if (!apiKey) throw new Error("No API Key");

    const systemInstructions = "Extract database structure from manual. JSON Only.";
    const userPrompt = `Extract from: ${text.substring(0, 15000)}`;

    try {
        if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey });
            const res = await ai.models.generateContent({
                model: model,
                contents: userPrompt,
                config: { systemInstruction: systemInstructions }
            });
            return extractJSON(res.text || "{}");
        } else {
             if (!baseURL) throw new Error("Missing Base URL");
             return await callOpenAICompatible(apiKey, baseURL, model, systemInstructions, userPrompt, false);
        }
    } catch (e) {
        return { id: '0', name: 'Import Failed', series: [] };
    }
};

export const chatWithAI = async (
    message: string, 
    context: any,
    lang: Language
): Promise<AIChatResponse> => {
    const { provider, apiKey } = getConfig();
    if (!apiKey) return { text: "Please configure API Key.", actions: [] };
    return { text: "Chat connected. Actions not fully implemented for this provider yet.", actions: [] };
};
