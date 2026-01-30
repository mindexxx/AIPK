
export type Language = 'en' | 'cn';

export interface ComparisonSpecItem {
  name: string;
  valueA: string | number;
  valueB: string | number;
  winner?: 'A' | 'B' | 'Tie';
}

export interface ProductSpec {
  category: string;
  pros: string[];
  cons: string[];
  summary: string;
}

export interface SimulationRule {
  id: string;
  name: string;
  value: string;
  unit: string;
}

export interface ExpectedResultQuery {
  id: string;
  query: string;
}

export interface ComparisonWarning {
  type: 'CATEGORY_MISMATCH' | 'IDENTICAL' | 'API_ERROR' | 'NONE';
  message: string;
}

export interface ComparisonResult {
  error?: string;
  productA: ProductSpec;
  productB: ProductSpec;
  sharedSpecs: ComparisonSpecItem[]; // Unified specs for direct comparison
  differences: string[];
  powerWinner: 'A' | 'B' | 'Tie';
  efficiencyWinner: 'A' | 'B' | 'Tie';
  verdict: string;
  recommendedRules: SimulationRule[]; 
  recommendedQueries: ExpectedResultQuery[]; 
  warning?: ComparisonWarning;
}

export interface UserComment {
  user: string;
  comment: string;
  source: string;
  url: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
}

export interface SimulationKPI {
  name: string;
  valueA: string | number;
  valueB: string | number;
  winner: 'A' | 'B' | 'Tie';
  unit?: string;
  description?: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
}

export interface SimulationMetricPoint {
  A: number;
  B: number;
  unit: string;
}

export interface TimelineEvent {
  time: string; // e.g. "08:00"
  description: string; // e.g. "Both units ramp up to 80% load"
  metrics: Record<string, SimulationMetricPoint>; // e.g. { "Temperature": {A: 50, B: 60, unit: 'C'} }
}

export interface SimulationResult {
  summary: string;
  period: string; // Dynamic period determined by AI (e.g., "24 Hours", "7 Days")
  questionAnswers: QuestionAnswer[];
  kpis: SimulationKPI[]; 
  userComments: UserComment[];
  timelineEvents: TimelineEvent[];
  // Added to support combined PDF export
  comparison?: ComparisonResult; 
  usedRules?: SimulationRule[]; // Added: stores the actual rules used for this simulation run
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  type: 'COMPARISON' | 'SIMULATION';
  modelA: string;
  modelB: string;
  data: ComparisonResult | SimulationResult;
}

// --- CUSTOMIZATION TYPES ---

export interface UserProfile {
  username: string;
  password?: string; // Stored locally for demo
  avatar?: string; // base64 or url
  bio?: string;
  isLoggedIn: boolean;
}

export interface CompanyProfile {
  name: string;
  description: string;
  website: string;
  images: string[]; // base64
}

export interface CustomIndex {
  id: string;
  name: string;
  value: string;
  type: 'text' | 'file';
  fileData?: string; // base64
}

export interface CustomProductModel {
  id: string;
  name: string;
  indexes: CustomIndex[];
}

export interface CustomProductSeries {
  id: string;
  name: string;
  description?: string; // Added
  models: CustomProductModel[];
}

export interface CustomProductDatabase {
  id: string;
  name: string;
  description?: string; // Added
  series: CustomProductSeries[];
}

export enum AppState {
  INPUT_MODELS = 'INPUT_MODELS',
  LOADING_SPECS = 'LOADING_SPECS',
  VIEW_SPECS = 'VIEW_SPECS',
  SETUP_SIMULATION = 'SETUP_SIMULATION',
  LOADING_SIMULATION = 'LOADING_SIMULATION',
  VIEW_SIMULATION = 'VIEW_SIMULATION',
  VIEW_HISTORY = 'VIEW_HISTORY',
  // Customization States
  COMPANY_PROFILE = 'COMPANY_PROFILE',
  EDIT_PRODUCT_MODEL = 'EDIT_PRODUCT_MODEL',
  EDIT_DATABASE = 'EDIT_DATABASE', // Added
  EDIT_SERIES = 'EDIT_SERIES'      // Added
}

// AI Control Actions
export type AIActionType = 'NAVIGATE' | 'SET_INPUTS' | 'TRIGGER_COMPARE' | 'TRIGGER_SIMULATION' | 'UPDATE_DATA';

export interface AIAction {
  type: AIActionType;
  payload?: any;
}

export interface AIChatResponse {
  text: string;
  actions?: AIAction[];
  updatedData?: any;
}

// Simple translation map
export const LABELS = {
  en: {
    title: "AIPK",
    subtitle: "for industry use",
    compEngine: "Comparison Engine",
    newComparison: "New Comparison",
    modelA: "First Model",
    modelB: "Second Model",
    start: "Start Analysis",
    analyzing: "Retrieving Specifications",
    simulating: "Running Simulation...",
    verdict: "Analysis Verdict",
    proceed: "Proceed to Simulation",
    configTitle: "Configure Running Simulation",
    configDesc: "Set running parameters to simulate real-world conditions over a timeline.",
    params: "Environment Parameters",
    queries: "Expected Results",
    run: "Start Running",
    report: "Running Simulation Report",
    summary: "Executive Summary",
    kpi: "Performance Indicators",
    settings: "Settings",
    provider: "AI Provider",
    apiKey: "API Key",
    save: "Save Changes",
    saved: "Saved",
    close: "Close",
    unknownModel: "Model not found. Please check the model name.",
    selectKey: "Please configure your API Key to start.",
    dash: "Dashboard",
    history: "History",
    sys: "System",
    config: "Configuration",
    online: "System Online",
    back: "Back",
    comments: "Community Feedback",
    timeline: "Real-time Running Status",
    translating: "Translating content...",
    highlights: "Highlights",
    specs: "Technical Specifications",
    historyTitle: "Analysis History",
    historyDesc: "Your recent comparisons and simulations are stored locally.",
    maxHistory: "Max 10 items stored. Oldest items are removed automatically.",
    load: "Load",
    delete: "Delete",
    noHistory: "No history found. Start a new comparison!",
    exportPdf: "Export PDF",
    // Report Labels
    liveLog: "Live Event Log",
    winner: "Winner",
    sourceThread: "Source Thread",
    noData: "No data available.",
    simEnv: "Simulation Environment",
    initializing: "Initializing simulation...",
    complete: "Complete",
    running: "Running...",
    // Customization
    customization: "Customization",
    login: "Login",
    register: "Register",
    createAccount: "Create Account",
    welcomeBack: "Welcome Back",
    username: "Username",
    password: "Password",
    noAccount: "No account yet?",
    alreadyAccount: "Already have an account?",
    companyProfile: "Company Profile",
    productDb: "Product Database",
    welcome: "Welcome back",
    editProfile: "Edit Profile",
    addDb: "New Database",
    addSeries: "New Series",
    addModel: "New Model",
    modelEditor: "Product Model Editor",
    indexes: "Technical Indexes",
    dbEditor: "Database Editor",
    seriesEditor: "Series Editor",
    description: "Introduction / Description",
    simCycle: "Simulation Cycle",
    enterName: "Enter Name...",
    companyName: "Company Name",
    website: "Website URL",
    coverImage: "Cover Image",
    clickUpload: "Click to upload image",
    displayName: "Display Name",
    bio: "Introduction / Bio",
    indexName: "Index Name",
    valueData: "Value / Data",
    confirm: "Confirm?",
    sure: "Sure?",
    noIndexes: "No indexes defined for this model yet.",
    createIndex: "Create first index",
    providerWarning: "Browser Restriction Warning (CORS): Direct connections to this API from a browser are often blocked. Please use Gemini or a proxy.",
    noSeries: "No series",
    noModels: "No models",
    // Importer
    importTitle: "Import Database from PDF",
    uploadTitle: "Upload Product Manual",
    uploadDesc: "Upload a PDF containing your product series and models. AI will automatically structure the database for you.",
    selectPdf: "Select PDF File",
    analyzingDoc: "Analyzing Document...",
    extracting: "Extracting text and identifying product structure.",
    analysisComplete: "Analysis Complete",
    reviewImport: "Review the extracted structure below before importing.",
    cancel: "Cancel",
    confirmImport: "Confirm Import",
    invalidPdf: "Please upload a valid PDF file.",
    importError: "Failed to process the PDF. Please try again.",
    // Exporter
    exportDbTitle: "Export Database",
    exportDbDesc: "Export your product database to Excel format (.xlsx).",
    selectDbToExport: "Select Database to Export",
    exportConfirm: "Confirm Export",
    downloading: "Downloading...",
    exportSuccess: "Export Successful"
  },
  cn: {
    title: "AIPK",
    subtitle: "工业版",
    compEngine: "产品对比引擎",
    newComparison: "新建对比",
    modelA: "产品型号 A",
    modelB: "产品型号 B",
    start: "开始分析",
    analyzing: "正在获取规格数据...",
    simulating: "正在进行运行模拟...",
    verdict: "AI 分析结论",
    proceed: "进入运行模拟",
    configTitle: "配置运行模拟",
    configDesc: "设置运行参数以模拟真实工况。",
    params: "环境参数",
    queries: "预期结果",
    run: "开始运行",
    report: "运行模拟报告",
    summary: "执行摘要",
    kpi: "关键性能指标",
    settings: "系统设置",
    provider: "AI 模型提供商",
    apiKey: "API 密钥",
    save: "保存更改",
    saved: "已保存",
    close: "关闭",
    unknownModel: "未找到该型号，请检查名称是否正确。",
    selectKey: "请先配置 API 密钥。",
    dash: "仪表盘",
    history: "历史记录",
    sys: "系统",
    config: "配置",
    online: "系统在线",
    back: "返回",
    comments: "社区反馈",
    timeline: "实时运行状态",
    translating: "正在翻译内容...",
    highlights: "核心亮点",
    specs: "技术规格对比",
    historyTitle: "分析历史",
    historyDesc: "您最近的对比和模拟记录已保存在本地。",
    maxHistory: "最多存储10条记录，旧记录将自动删除。",
    load: "加载",
    delete: "删除",
    noHistory: "暂无历史记录，请开始新的对比！",
    exportPdf: "导出 PDF",
    // Report Labels
    liveLog: "实时事件日志",
    winner: "胜出",
    sourceThread: "来源讨论",
    noData: "暂无可用数据。",
    simEnv: "模拟环境配置",
    initializing: "正在初始化模拟...",
    complete: "已完成",
    running: "运行中...",
    // Customization
    customization: "定制中心",
    login: "登录",
    register: "注册",
    createAccount: "创建账户",
    welcomeBack: "欢迎回来",
    username: "用户名",
    password: "密码",
    noAccount: "还没有账号？",
    alreadyAccount: "已有账号？",
    companyProfile: "企业资料",
    productDb: "产品数据库",
    welcome: "欢迎",
    editProfile: "编辑资料",
    addDb: "新建数据库",
    addSeries: "新建系列",
    addModel: "新建型号",
    modelEditor: "产品型号编辑器",
    indexes: "技术指标",
    dbEditor: "数据库编辑器",
    seriesEditor: "系列编辑器",
    description: "简介 / 描述",
    simCycle: "模拟运行周期",
    enterName: "输入名称...",
    companyName: "企业名称",
    website: "官方网站",
    coverImage: "封面图片",
    clickUpload: "点击上传图片",
    displayName: "显示名称",
    bio: "个人简介 / 描述",
    indexName: "指标名称",
    valueData: "数值 / 数据",
    confirm: "确认？",
    sure: "确定删除？",
    noIndexes: "暂无定义的指标数据。",
    createIndex: "创建第一个指标",
    providerWarning: "浏览器限制警告 (CORS): 由于安全策略，直接从浏览器连接该 API 可能会被拦截。建议使用 Gemini 或配置代理。",
    noSeries: "暂无系列",
    noModels: "暂无型号",
    // Importer
    importTitle: "从 PDF 导入数据库",
    uploadTitle: "上传产品手册",
    uploadDesc: "上传包含产品系列和型号的 PDF 文件，AI 将自动为您构建数据库结构。",
    selectPdf: "选择 PDF 文件",
    analyzingDoc: "正在分析文档...",
    extracting: "正在提取文本并识别产品结构。",
    analysisComplete: "分析完成",
    reviewImport: "请在导入前检查提取的结构。",
    cancel: "取消",
    confirmImport: "确认导入",
    invalidPdf: "请上传有效的 PDF 文件。",
    importError: "处理 PDF 失败，请重试。",
    // Exporter
    exportDbTitle: "导出数据库",
    exportDbDesc: "将您的产品数据库导出为 Excel 格式 (.xlsx)。",
    selectDbToExport: "选择要导出的数据库",
    exportConfirm: "确认导出",
    downloading: "正在下载...",
    exportSuccess: "导出成功"
  }
};