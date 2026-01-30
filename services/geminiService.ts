
import { GoogleGenAI } from "@google/genai";
import { ComparisonResult, SimulationResult, SimulationRule, ExpectedResultQuery, Language, AIChatResponse, AppState, CustomProductModel, CustomProductDatabase } from "../types";

const GEMINI_MODEL = 'gemini-3-flash-preview';

// Helper to get configuration
const getConfig = () => {
  const savedKeys = localStorage.getItem('inducomp_api_keys');
  const activeProvider = localStorage.getItem('inducomp_active_provider') || 'gemini';
  let apiKey = '';
  
  if (savedKeys) {
    try {
      const keys = JSON.parse(savedKeys);
      apiKey = keys[activeProvider] || '';
    } catch (e) { console.error(e); }
  }

  // Fallback for Gemini env var
  if (!apiKey && activeProvider === 'gemini' && typeof process !== 'undefined' && process.env.API_KEY) {
    apiKey = process.env.API_KEY;
  }

  return { provider: activeProvider, apiKey };
};

// Robust JSON Extractor with cleaning
const extractJSON = (text: string): any => {
  if (!text) throw new Error("Empty response from AI");

  let jsonString = text;

  // 1. Try finding JSON inside Markdown code blocks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = text.match(codeBlockRegex);
  if (match) {
    jsonString = match[1];
  }

  // 2. Find the outer-most JSON object brackets to avoid preamble text
  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  }

  // 3. Remove comments (// and /* */) which some AIs include in JSON
  jsonString = jsonString
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');

  // 4. Attempt parse
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn("Direct JSON parse failed, attempting cleanup...", e);
    // 5. Common cleanup: remove trailing commas, fix newlines in strings
    try {
        const cleaned = jsonString
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/[\n\r\t]/g, ' '); // Flatten newlines
        return JSON.parse(cleaned);
    } catch (e2) {
        console.error("Failed JSON String:", jsonString);
        throw new Error("The AI response was incomplete or invalid JSON. Please try again or simplify the request.");
    }
  }
};

// --- MOCK DATA GENERATORS (Fallback for API Quota/Errors) ---

const getMockComparisonData = (modelA: string, modelB: string): ComparisonResult => {
  return {
    productA: {
      category: "Industrial Machine (Demo)",
      pros: ["High durability", "Widely available parts", "Proven track record"],
      cons: ["Lower efficiency", "Heavier", "Older technology"],
      summary: `(DEMO) ${modelA} is a rugged, reliable legacy model known for durability.`
    },
    productB: {
      category: "Industrial Machine (Demo)",
      pros: ["High efficiency", "Compact design", "Smart controls"],
      cons: ["Higher maintenance cost", "Complex electronics", "Newer to market"],
      summary: `(DEMO) ${modelB} represents modern high-efficiency technology with smart features.`
    },
    sharedSpecs: [
      { name: "Power Output", valueA: "1200 kW", valueB: "1250 kW", winner: "B" },
      { name: "Thermal Efficiency", valueA: "38%", valueB: "42%", winner: "B" },
      { name: "Weight", valueA: "4500 kg", valueB: "3800 kg", winner: "B" },
      { name: "Noise Level", valueA: "85 dB", valueB: "78 dB", winner: "B" },
      { name: "Maintenance Interval", valueA: "1000 hrs", valueB: "800 hrs", winner: "A" },
      { name: "Fuel Consumption", valueA: "280 L/hr", valueB: "260 L/hr", winner: "B" }
    ],
    differences: [
      "Model B has significantly better thermal efficiency.",
      "Model A requires less frequent maintenance.",
      "Model B is quieter and lighter."
    ],
    powerWinner: 'B',
    efficiencyWinner: 'B',
    verdict: "Model B is the superior choice for efficiency and footprint, while Model A is better for rugged, low-maintenance environments. (DEMO DATA: API Unavailable)",
    recommendedRules: [
      { id: '1', name: 'Ambient Temp', value: '25', unit: 'C' },
      { id: '2', name: 'Load Factor', value: '80', unit: '%' }
    ],
    recommendedQueries: [
      { id: '1', query: 'Which one has lower operating costs?' },
      { id: '2', query: 'Which handles load spikes better?' }
    ],
    warning: {
      type: 'API_ERROR',
      message: 'System is running in Demo Mode due to API limits or connectivity issues. Data is simulated.'
    }
  };
};

const getMockSimulationData = (modelA: string, modelB: string): SimulationResult => {
  return {
    summary: `(DEMO SIMULATION) At 80% load, ${modelB} demonstrates 15% lower fuel consumption than ${modelA}.`,
    period: "3 Months (Industrial Cycle)",
    questionAnswers: [
        { question: "Which is cheaper?", answer: "Model B is cheaper to operate due to fuel savings." },
        { question: "Which is steadier?", answer: "Model A shows less variance in output during thermal shifts." }
    ],
    kpis: [
        { name: "Fuel Cost", valueA: "4,500", valueB: "3,825", unit: "$", winner: "B" },
        { name: "CO2 Emissions", valueA: "12.5", valueB: "10.8", unit: "Tons", winner: "B" },
        { name: "Uptime", valueA: "99.9", valueB: "99.5", unit: "%", winner: "A" }
    ],
    userComments: [
        { user: "PlantMgr_Mike", comment: "We switched to the B units last year.", source: "IndustryForum", url: "https://example.com", sentiment: "Positive" }
    ],
    timelineEvents: [
        { time: "Week 1", description: "Initial Deployment", metrics: { "Efficiency": {A: 38, B: 42, unit: "%"}, "Temp": {A: 60, B: 55, unit: "C"} } },
        { time: "Week 2", description: "Load Test", metrics: { "Efficiency": {A: 37, B: 41, unit: "%"}, "Temp": {A: 65, B: 58, unit: "C"} } },
        { time: "Week 4", description: "Steady State", metrics: { "Efficiency": {A: 38, B: 42, unit: "%"}, "Temp": {A: 62, B: 56, unit: "C"} } },
        { time: "Week 8", description: "Maintenance Check", metrics: { "Efficiency": {A: 35, B: 40, unit: "%"}, "Temp": {A: 60, B: 55, unit: "C"} } },
        { time: "Week 12", description: "End of Quarter", metrics: { "Efficiency": {A: 38, B: 42, unit: "%"}, "Temp": {A: 61, B: 56, unit: "C"} } }
    ]
  };
};


// --- Generic Fetch for OpenAI Compatible APIs ---
const callOpenAICompatible = async (apiKey: string, baseURL: string, model: string, systemPrompt: string, userPrompt: string, jsonMode = true) => {
  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
        model: model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        response_format: jsonMode ? { type: 'json_object' } : undefined,
        temperature: 0.2, 
        max_tokens: 4096 
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API Error (${model}): ${err}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("No content returned");

    return extractJSON(content);
  } catch (error: any) {
    console.warn("AI Service Error (Recoverable):", error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(`Network/CORS Error: Browser blocked access to ${baseURL}.`);
    }
    throw error;
  }
};

// --- Anthropic Fetch ---
const callAnthropic = async (apiKey: string, systemPrompt: string, userPrompt: string) => {
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerously-allow-browser': 'true' 
        },
        body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.2
        })
    });

    if (!response.ok) {
        throw new Error(`Anthropic API Status: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text;
    
    return extractJSON(text);
  } catch (error: any) {
    console.warn("Claude Service Error:", error);
    if (error.message.includes('Failed to fetch') || error instanceof TypeError) {
        throw new Error("CORS Blocked: Anthropic API does not support direct browser calls. Please use Gemini.");
    }
    throw error;
  }
};


// --- Main Service Functions ---

export const parseProductManual = async (text: string, lang: Language): Promise<CustomProductDatabase> => {
    const { provider, apiKey } = getConfig();
    const langText = lang === 'cn' ? 'Simplified Chinese' : 'English';
    
    if (!apiKey) throw new Error("No API Key provided");

    const systemInstructions = `
        You are an expert Data Engineer specializing in extracting structured product data from unstructured technical manuals.
        Language: ${langText}.

        Your task is to analyze the provided text from a product manual and organize it into a strict hierarchical database structure.
        
        OUTPUT FORMAT RULES:
        1. Return ONLY valid JSON.
        2. Do NOT use Markdown formatting (no \`\`\`json blocks).
        3. Do NOT include comments in the JSON.
        4. Escape all special characters in strings properly.
        5. If the extracted text is too long, prioritize extracting the main Series and Models over minor details.

        Structure Requirement:
        {
            "name": "Database Name (Category)",
            "description": "Short description",
            "series": [
                {
                    "name": "Series Name",
                    "description": "Series description",
                    "models": [
                        {
                            "name": "Model Name",
                            "indexes": [
                                { "name": "Spec Name", "value": "Spec Value", "type": "text" }
                            ]
                        }
                    ]
                }
            ]
        }
    `;

    const userPrompt = `
        Here is the text content extracted from a product manual PDF:
        
        ${text.substring(0, 45000)} 
        
        Extract the database structure now. Return JSON only.
    `;

    if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: userPrompt,
            config: {
                systemInstruction: systemInstructions,
                responseMimeType: "application/json",
                temperature: 0.1,
                maxOutputTokens: 8192,
            }
        });
        if (!response.text) throw new Error("No extracted data received from AI");
        
        // Post-process to add IDs since AI won't generate unique IDs robustly
        const rawData = extractJSON(response.text);
        
        // Add IDs
        const dbId = Date.now().toString();
        const processed: CustomProductDatabase = {
            id: dbId,
            name: rawData.name || "Imported Database",
            description: rawData.description,
            series: (rawData.series || []).map((s: any, sIdx: number) => ({
                id: `${dbId}-s-${sIdx}`,
                name: s.name || "Unknown Series",
                description: s.description,
                models: (s.models || []).map((m: any, mIdx: number) => ({
                    id: `${dbId}-s-${sIdx}-m-${mIdx}`,
                    name: m.name || "Unknown Model",
                    indexes: (m.indexes || []).map((i: any, iIdx: number) => ({
                        id: `${dbId}-s-${sIdx}-m-${mIdx}-i-${iIdx}`,
                        name: i.name,
                        value: i.value,
                        type: 'text'
                    }))
                }))
            }))
        };
        
        return processed;
    }

    // Fallback for other providers (generic implementation)
    const rawData = await callOpenAICompatible(apiKey, '', '', systemInstructions, userPrompt);
     // Add IDs (same logic)
    const dbId = Date.now().toString();
    const processed: CustomProductDatabase = {
        id: dbId,
        name: rawData.name || "Imported Database",
        description: rawData.description,
        series: (rawData.series || []).map((s: any, sIdx: number) => ({
            id: `${dbId}-s-${sIdx}`,
            name: s.name || "Unknown Series",
            description: s.description,
            models: (s.models || []).map((m: any, mIdx: number) => ({
                id: `${dbId}-s-${sIdx}-m-${mIdx}`,
                name: m.name || "Unknown Model",
                indexes: (m.indexes || []).map((i: any, iIdx: number) => ({
                    id: `${dbId}-s-${sIdx}-m-${mIdx}-i-${iIdx}`,
                    name: i.name,
                    value: i.value,
                    type: 'text'
                }))
            }))
        }))
    };
    return processed;
};

export const translateData = async (data: any, targetLang: Language): Promise<any> => {
  return data; 
};

export const compareProducts = async (
    modelA: string, 
    modelB: string, 
    lang: Language,
    localDataA?: CustomProductModel,
    localDataB?: CustomProductModel
): Promise<ComparisonResult> => {
  const { provider, apiKey } = getConfig();
  const langText = lang === 'cn' ? 'Simplified Chinese' : 'English';

  try {
    if (!apiKey) throw new Error("No API Key provided");

    // Construct the schema logic
    let schemaInstruction = "";
    let localDataContext = "";

    // If we have local data, we treat that as the SOURCE OF TRUTH for the index structure
    if (localDataA || localDataB) {
        const source = localDataA || localDataB; // Prefer A if both exist, but structure is likely similar if user created both
        const indexes = source!.indexes.map(i => i.name);
        schemaInstruction = `
            CRITICAL: You MUST use the following technical index structure for the comparison "sharedSpecs".
            Do NOT invent new rows. Only use these exact parameter names:
            ${JSON.stringify(indexes)}
            
            DATA PRIORITY LOGIC:
            1. LOCAL DATABASE: Use the provided JSON data for local models exactly as written.
            2. INTERNET DATA: If a model is not in the local database, search your internal knowledge base (Internet Data) to find the values for the REQUIRED parameters defined above.
            3. INFORMATION MISSED: If a specific parameter cannot be found in the local database AND cannot be found in your internal knowledge base, set the value to "Information Missed" (or localized equivalent).
            
            Do NOT fail if a model is missing locally. Always fallback to Internet Data.
        `;
        
        if (localDataA) {
            const formattedA = localDataA.indexes.reduce((acc, curr) => ({...acc, [curr.name]: curr.value}), {});
            localDataContext += `\nModel A (${modelA}) IS A LOCAL DATABASE MODEL. USE THIS DATA EXACTLY: ${JSON.stringify(formattedA)}\n`;
        }
        if (localDataB) {
            const formattedB = localDataB.indexes.reduce((acc, curr) => ({...acc, [curr.name]: curr.value}), {});
            localDataContext += `\nModel B (${modelB}) IS A LOCAL DATABASE MODEL. USE THIS DATA EXACTLY: ${JSON.stringify(formattedB)}\n`;
        }
    } else {
        // Default behavior if no local data
        schemaInstruction = "Compare the products using a SHARED list of 6-8 standard technical parameters for this industry.";
    }

    const systemInstructions = `
        You are a technical data extraction engine.
        Language: ${langText}.
        
        ${schemaInstruction}
        
        IMPORTANT: ACCURACY IS CRITICAL.
        - For specifications (Weight, Dimensions, Power), be precise.
        - For MARKET VALUES (e.g. Price, 2nd Hand Price, Resale Value):
          - You MUST provide realistic market data based on known listings or industry averages.
          - Do NOT underestimate industrial equipment costs.
          - If the price varies, provide a range (e.g., "$15,000 - $20,000").
          - If data is scarce, estimate based on similar models but explicitly mark it as "Est.".
          - Do NOT simply put "Information Missed" for major pricing questions unless absolutely unknown. Try to find a proxy.
        
        VALIDATION CHECK:
        - If modelA and modelB are effectively the same product, set "warning" type to "IDENTICAL".
        - If modelA and modelB are from fundamentally different industrial categories, set "warning" type to "CATEGORY_MISMATCH".
        - Otherwise set "warning" type to "NONE".

        Output Pure JSON.
    `;

    const userPrompt = `
        Compare ${modelA} vs ${modelB}.
        
        ${localDataContext}

        Return the comparison JSON.
        
        Required JSON Format:
        {
        "productA": { "category": "Type", "pros": ["Pro1"], "cons": ["Con1"], "summary": "Short desc" },
        "productB": { "category": "Type", "pros": ["Pro1"], "cons": ["Con1"], "summary": "Short desc" },
        "sharedSpecs": [
            { "name": "Exact Parameter Name", "valueA": "Value or 'Information Missed'", "valueB": "Value" }
        ],
        "differences": ["Diff1", "Diff2"],
        "powerWinner": "A",
        "efficiencyWinner": "B",
        "verdict": "Verdict",
        "recommendedRules": [{"id": "1", "name": "Load", "value": "80", "unit": "%"}],
        "recommendedQueries": [{"id": "1", "query": "Efficiency?"}],
        "warning": { "type": "NONE", "message": "" }
        }
    `;

    if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: userPrompt,
        config: {
            systemInstruction: systemInstructions,
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: 8192,
        }
        });
        if (!response.text) throw new Error("No data received from AI");
        return extractJSON(response.text);
    }
    
    let baseURL = '';
    let model = '';
    switch (provider) {
        case 'chatgpt': baseURL = 'https://api.openai.com/v1'; model = 'gpt-4o'; break;
        case 'deepseek': baseURL = 'https://api.deepseek.com'; model = 'deepseek-chat'; break;
        case 'qwen': baseURL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'; model = 'qwen-plus'; break;
        case 'doubao': baseURL = 'https://ark.cn-beijing.volces.com/api/v3'; model = 'doubao-pro-4k'; break;
        case 'claude': return callAnthropic(apiKey, systemInstructions, userPrompt);
        default: throw new Error(`Provider ${provider} not implemented yet.`);
    }

    return await callOpenAICompatible(apiKey, baseURL, model, systemInstructions, userPrompt);

  } catch (error: any) {
      console.warn("Comparison API Failed (using fallback):", error);
      return getMockComparisonData(modelA, modelB);
  }
};

export const runSimulation = async (
  modelA: string,
  modelB: string,
  rules: SimulationRule[],
  expectations: ExpectedResultQuery[],
  lang: Language
): Promise<SimulationResult> => {
  const { provider, apiKey } = getConfig();
  const langText = lang === 'cn' ? 'Simplified Chinese' : 'English';

  try {
    if (!apiKey) throw new Error("No API Key");

    const rulesText = rules.map(r => `${r.name}: ${r.value} ${r.unit}`).join('\n');
    const questionsText = expectations.map(e => e.query).join('\n');

    // ENHANCED PROMPT: STRICT ADHERENCE TO RULES AND QUERIES
    const systemInstructions = `
        Role: Advanced Industrial Simulation Engine.
        Language: ${langText}.
        
        Objective: 
        1. Simulate the operation of ${modelA} and ${modelB} based *exclusively* on the provided ENVIRONMENTAL CONDITIONS.
        2. Provide specific, calculated answers to the user's EXPECTED RESULT QUERIES.

        CRITICAL INSTRUCTIONS:
        
        1. **ENVIRONMENT ADHERENCE**:
           - You MUST incorporate the "Environment Parameters" into your simulation logic.
           - If "Ambient Temp" is High, show cooling/efficiency losses.
           - If "Load" is varied, show fuel/power changes matching that load.
           - Do NOT ignore these values. They are the boundary conditions.
        
        2. **QUERY ANSWERING**:
           - The "questionAnswers" array MUST contain exactly one answer for every query in "User Queries".
           - **DO NOT** output generic answers like "It depends". Calculate a value based on the simulation data.
           - If the user asks for "Cost per month", estimate the fuel/power consumption from the simulation ticks and multiply by standard industrial rates, then give a dollar amount (e.g., "$4,500/month").
           - If the user asks for "Glitch probability", provide a risk assessment based on the environment (e.g., "Low risk at 25C, High risk if >45C").
           - Do not add default questions. Only answer what is asked.

        3. **TIMELINE LOGIC**:
           - Generate 10-15 data points.
           - Ensure the metrics track with the environment. E.g., if Load is 100%, Temp should rise over time until steady state.

        Output: Pure JSON.
    `;

    const userPrompt = `
        [MODELS]
        Model A: ${modelA}
        Model B: ${modelB}

        [ENVIRONMENT PARAMETERS]
        ${rulesText}

        [USER QUERIES (Answer these specifically)]
        ${questionsText}
        
        [REQUIRED JSON STRUCTURE]
        {
          "summary": "Executive summary of the simulation run under these specific conditions.",
          "period": "The simulation duration (e.g. '24 Hours', '1 Month')",
          "questionAnswers": [
            { "question": "Exact text of User Query 1", "answer": "Specific calculated answer" },
            { "question": "Exact text of User Query 2", "answer": "Specific calculated answer" }
          ],
          "kpis": [
            { "name": "Metric Name", "valueA": "val", "valueB": "val", "unit": "unit", "winner": "A"|"B"|"Tie" }
          ],
          "timelineEvents": [
            {
              "time": "T1",
              "description": "Event description",
              "metrics": {
                "MetricName": { "A": 100, "B": 100, "unit": "unit" }
              }
            }
          ],
          "userComments": []
        }
    `;

    if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: userPrompt,
        config: {
            systemInstruction: systemInstructions,
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 8192,
        }
        });
        if (!response.text) throw new Error("No data received");
        return extractJSON(response.text);
    }

    let baseURL = '';
    let model = '';
    switch (provider) {
        case 'chatgpt': baseURL = 'https://api.openai.com/v1'; model = 'gpt-4o'; break;
        case 'deepseek': baseURL = 'https://api.deepseek.com'; model = 'deepseek-chat'; break;
        case 'qwen': baseURL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'; model = 'qwen-plus'; break;
        case 'doubao': baseURL = 'https://ark.cn-beijing.volces.com/api/v3'; model = 'doubao-pro-4k'; break;
        case 'claude': return callAnthropic(apiKey, systemInstructions, userPrompt);
        default: throw new Error(`Provider ${provider} not implemented yet.`);
    }

    return await callOpenAICompatible(apiKey, baseURL, model, systemInstructions, userPrompt);
  } catch (error: any) {
      console.warn("Simulation API Failed (using fallback):", error);
      return getMockSimulationData(modelA, modelB);
  }
};

export const chatWithAI = async (
    message: string, 
    context: {
        currentState: AppState,
        modelA?: string,
        modelB?: string,
        data?: any
    },
    lang: Language
): Promise<AIChatResponse> => {
    const { provider, apiKey } = getConfig();
    const langText = lang === 'cn' ? 'Simplified Chinese' : 'English';

    try {
        if (!apiKey) throw new Error("No API Key");

        const systemInstructions = `
            You are the Central Controller AI for "AIPK".
            You have FULL CONTROL over the application interface.
            
            AVAILABLE ACTIONS (Return these in the 'actions' array):
            1. { "type": "NAVIGATE", "payload": "INPUT_MODELS" | "VIEW_SPECS" | "SETUP_SIMULATION" } -> Change screen.
            2. { "type": "SET_INPUTS", "payload": { "modelA": "...", "modelB": "..." } } -> Fill in the comparison form.
            3. { "type": "TRIGGER_COMPARE" } -> Click the 'Start Analysis' button.
            4. { "type": "TRIGGER_SIMULATION" } -> Click the 'Run Simulation' button.
            5. { "type": "UPDATE_DATA", "payload": { ...complete_json_structure... } } -> Modify the displayed report data directly.
            
            IMPORTANT DATA UPDATE RULE:
            When the user asks to add/modify data, you MUST return the COMPLETE JSON object in the "payload", incorporating the new information into the existing data.
            Do NOT return a partial object. Access the "Current Data" below, modify it, and return the WHOLE thing in UPDATE_DATA.

            CURRENT CONTEXT:
            State: ${context.currentState}
            Models: ${context.modelA} vs ${context.modelB}
            Current Data: ${JSON.stringify(context.data || {})}
            Language: ${langText}

            YOUR GOAL:
            1. Understand the user's intent.
            2. If they want to DO something (navigate, compare, run), return the appropriate ACTION(s).
            3. If they want to change data, return UPDATE_DATA with the FULL MERGED JSON.
            4. If they just ask a question, answer in 'text'.
            
            Examples:
            - "Add a spec for Noise Level" -> actions: [{type: "UPDATE_DATA", payload: { ...full_original_json_plus_new_field... }}]
            - "Run the simulation" -> actions: [{type: "TRIGGER_SIMULATION"}]
            
            Keep text concise.
        `;

        const userPrompt = `User: "${message}"`;

        const format = `
        Response format (JSON ONLY):
        {
            "text": "Your conversational response",
            "actions": [ { "type": "...", "payload": ... } ]
        }
        `;

        const finalPrompt = `${userPrompt}\n\n${format}`;

        if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: finalPrompt,
                config: {
                    systemInstruction: systemInstructions,
                    responseMimeType: "application/json",
                    temperature: 0.1, 
                }
            });
            if (!response.text) throw new Error("No response");
            return extractJSON(response.text);
        }

        let baseURL = '';
        let model = '';
        switch (provider) {
            case 'chatgpt': baseURL = 'https://api.openai.com/v1'; model = 'gpt-4o'; break;
            case 'deepseek': baseURL = 'https://api.deepseek.com'; model = 'deepseek-chat'; break;
            case 'qwen': baseURL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'; model = 'qwen-plus'; break;
            case 'doubao': baseURL = 'https://ark.cn-beijing.volces.com/api/v3'; model = 'doubao-pro-4k'; break;
            case 'claude': return callAnthropic(apiKey, systemInstructions, finalPrompt);
            default: throw new Error(`Provider ${provider} not implemented yet.`);
        }

        return await callOpenAICompatible(apiKey, baseURL, model, systemInstructions, finalPrompt);
    } catch (e) {
        console.warn("Chat API Error (Demo Mode):", e);
        return {
            text: "I am unable to connect to the AI service right now (Demo Mode). I can still help you navigate.",
            actions: []
        };
    }
};
