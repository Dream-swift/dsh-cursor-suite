/**
 * dsh-cursor-suite 客户端入口。
 *
 * 两半原本各自是一个自注册的客户端模块（`window.__ModuleLoader__.load({id, factory})`），
 * 各自往 `settings.section` 里塞一项。这里把两份源码原样收进来，再把它们的
 * `ctx.slots.register` 截住，最后由一个侧边栏页面把两个面板上下摆在同一页：
 * 上面是 Cursor 订阅，下面是图片识读。设置页里不再出现。
 *
 * 侧边栏的挂法与 dsh-aurabot-qq 一致：`sidebar.panellist` 出图标，
 * `main` 出页面，两处用同一个 id / key，点图标就切到这一页。
 *
 * 生成方式：`_diag/build_suite_client.js`。两份源码保持原样，不要手改。
 */
(function () {
  var loader = window.__ModuleLoader__;
  if (!loader || typeof loader.load !== "function") return;

  var captured = [];
  var realLoad = loader.load;

  loader.load = function (options) {
    if (options && typeof options.factory === "function") captured.push(options);
  };

  try {
  // ===== cursor（订阅）原始 bundle =====
window.__ModuleLoader__.load({
	id: "dsh-cursor-subscription",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");

		//#region src/client.jsx
		const inject = ["slots", "locale", "connection"];
		const NS = "settings.cursorSubscription";
		const CHANNEL = "/cursor-subscription";

		const zh = {
			nav: "Cursor 套件",
			title: "Cursor 套件",
			connected: "已登录",
			disconnected: "未登录",
			accountLoading: "正在读取账户状态…",
			login: "浏览器登录",
			logout: "退出登录",
			cancel: "取消",
			openLogin: "打开登录页",
			waiting: "正在等待登录完成…",
			failed: "登录失败，请重试。",
			loadFailed: "无法读取 Cursor 状态。",
			note: "在浏览器中登录 Cursor 账户后，即可在模型选择器中使用 Cursor 订阅模型。登录信息仅保存在本机，不会上传。",
			expiresAt: "令牌有效至 {value}",
			usage: "订阅用量",
			usageRefresh: "刷新",
			usageRefreshing: "刷新中…",
			usageNotSignedIn: "登录后可查看 Cursor 返回的用量。",
			usageLoading: "正在读取用量…",
			usageUpdated: "更新于 {value}",
			usageItem: "项目",
			usageTokens: "Tokens",
			usagePercent: "用量",
			autoOverflow: "auto（溢出）",
			modelUsage: "模型用量",
			plan: "套餐",
			unlimited: "不限额",
			includedRequests: "包含请求",
			requestsUsed: "已用 {used} / {limit} 次请求（{pct}%）",
			onDemandSpend: "按需消费",
			autoUsage: "计划 Cursor 模型使用量",
			otherModels: "计划其他模型使用量",
			spendUsedOf: "已消费 ${used} / ${limit}",
			billingCycle: "账单周期",
			billingDaysLeft: "剩余 {value} 天",
			models: "模型列表",
			modelsRefresh: "刷新模型列表",
			modelsRefreshing: "刷新中…",
			modelsCount: "{value} 个模型",
			modelsLoading: "正在读取模型列表…",
			runtimeSettings: "运行设置",
			runtimeSettingsNote: "设置会保存到当前 DSH profile，并从下一次 Cursor 请求开始生效。",
			maxToolRounds: "最大工具轮次",
			maxToolRoundsHint: "单次 Cursor 任务允许的工具轮次，超过后以 TOOL_LIMIT 终止。范围 1–1000。",
			retryCount: "重试次数",
			retryCountHint: "匹配状态码时允许的额外请求次数。默认 0（关闭），启用后可能重复 Cursor 远端模型请求或用量。范围 0–10。",
			retryInterval: "重试间隔（毫秒）",
			retryIntervalHint: "每次 HTTP 重试前等待的固定时间。范围 0–300000。",
			retryStatuses: "重试 HTTP 状态码",
			retryStatusesHint: "使用逗号分隔，例如 408, 425, 429, 500, 502, 503, 504。",
			replayHistoryEachStep: "每步重放完整历史",
			replayHistoryEachStepHint: "每一步都从 DSH 的对话历史重建 Cursor 会话，而不是复用 Cursor 服务端保存的会话。模型因此始终看到完整历史，代价是 token 随步数增长。默认关闭。",
			saveSettings: "保存设置",
			savingSettings: "保存中…",
			reloadSettings: "重新加载",
			loadingSettings: "加载中…",
			settingsSaved: "设置已保存。",
			settingsLoadFailed: "无法读取运行设置。",
			settingsSaveFailed: "无法保存运行设置。",
			settingsInvalid: "请检查工具轮次、重试次数、间隔和 HTTP 状态码。",
		};
		const en = {
			nav: "Cursor",
			title: "Cursor subscription",
			connected: "Signed in",
			disconnected: "Not signed in",
			accountLoading: "Reading account status…",
			login: "Browser sign-in",
			logout: "Sign out",
			cancel: "Cancel",
			openLogin: "Open sign-in page",
			waiting: "Waiting for sign-in to finish…",
			failed: "Sign-in failed. Try again.",
			loadFailed: "Could not read Cursor state.",
			note: "After signing in with a Cursor account in the browser, Cursor subscription models become available in the model picker. Credentials stay on this machine.",
			expiresAt: "Token valid until {value}",
			usage: "Subscription usage",
			usageRefresh: "Refresh",
			usageRefreshing: "Refreshing…",
			usageNotSignedIn: "Sign in to read usage reported by Cursor.",
			usageLoading: "Reading usage…",
			usageUpdated: "Updated {value}",
			usageItem: "Item",
			usageTokens: "Tokens",
			usagePercent: "Usage",
			autoOverflow: "auto (overflow)",
			modelUsage: "Model usage",
			plan: "Plan",
			unlimited: "Unlimited",
			includedRequests: "Included requests",
			requestsUsed: "{used} / {limit} requests used ({pct}%)",
			onDemandSpend: "On-demand spend",
			autoUsage: "Plan Cursor model usage",
			otherModels: "Plan other model usage",
			spendUsedOf: "${used} / ${limit} spent",
			billingCycle: "Billing cycle",
			billingDaysLeft: "{value} days left",
			models: "Models",
			modelsRefresh: "Refresh models",
			modelsRefreshing: "Refreshing…",
			modelsCount: "{value} models",
			modelsLoading: "Reading model list…",
			runtimeSettings: "Runtime settings",
			runtimeSettingsNote: "Settings are stored in the current DSH profile and apply from the next Cursor request.",
			maxToolRounds: "Maximum tool rounds",
			maxToolRoundsHint: "Tool rounds allowed in one Cursor task before TOOL_LIMIT stops it. Range: 1–1000.",
			retryCount: "Retry count",
			retryCountHint: "Additional attempts for matching statuses. Default: 0 (off). Enabling retries may repeat remote Cursor model work or usage. Range: 0–10.",
			retryInterval: "Retry interval (ms)",
			retryIntervalHint: "Fixed delay before each HTTP retry. Range: 0–300000.",
			retryStatuses: "Retry HTTP status codes",
			retryStatusesHint: "Comma-separated, for example: 408, 425, 429, 500, 502, 503, 504.",
			replayHistoryEachStep: "Replay the full history each step",
			replayHistoryEachStepHint: "Rebuilds the Cursor conversation from the DSH history on every step instead of resuming the one Cursor keeps server-side, so the model always sees the complete history. The cost is that tokens grow with the step count. Default: off.",
			saveSettings: "Save settings",
			savingSettings: "Saving…",
			reloadSettings: "Reload",
			loadingSettings: "Loading…",
			settingsSaved: "Settings saved.",
			settingsLoadFailed: "Could not read runtime settings.",
			settingsSaveFailed: "Could not save runtime settings.",
			settingsInvalid: "Check the tool rounds, retry count, interval, and HTTP status codes.",
		};
		const zhHant = {
			nav: "Cursor 套件",
			title: "Cursor 套件",
			connected: "已登入",
			disconnected: "未登入",
			accountLoading: "正在讀取帳戶狀態…",
			login: "瀏覽器登入",
			logout: "登出",
			cancel: "取消",
			openLogin: "開啟登入頁",
			waiting: "正在等待登入完成…",
			failed: "登入失敗，請重試。",
			loadFailed: "無法讀取 Cursor 狀態。",
			note: "在瀏覽器登入 Cursor 帳戶後，即可在模型選擇器中使用 Cursor 訂閱模型。登入資訊僅保存在本機，不會上傳。",
			expiresAt: "權杖有效至 {value}",
			usage: "訂閱用量",
			usageRefresh: "重新整理",
			usageRefreshing: "重新整理中…",
			usageNotSignedIn: "登入後可查看 Cursor 回報的用量。",
			usageLoading: "正在讀取用量…",
			usageUpdated: "更新於 {value}",
			usageItem: "項目",
			usageTokens: "Tokens",
			usagePercent: "用量",
			autoOverflow: "auto（溢出）",
			modelUsage: "模型用量",
			plan: "方案",
			unlimited: "不限額",
			includedRequests: "包含請求",
			requestsUsed: "已用 {used} / {limit} 次請求（{pct}%）",
			onDemandSpend: "隨用隨付支出",
			autoUsage: "方案 Cursor 模型用量",
			otherModels: "方案其他模型用量",
			spendUsedOf: "已消費 ${used} / ${limit}",
			billingCycle: "帳單週期",
			billingDaysLeft: "剩餘 {value} 天",
			models: "模型清單",
			modelsRefresh: "重新整理模型清單",
			modelsRefreshing: "重新整理中…",
			modelsCount: "{value} 個模型",
			modelsLoading: "正在讀取模型清單…",
			runtimeSettings: "執行設定",
			runtimeSettingsNote: "設定會儲存到目前的 DSH profile，並從下一次 Cursor 請求開始生效。",
			maxToolRounds: "最大工具輪次",
			maxToolRoundsHint: "單次 Cursor 任務允許的工具輪次，超過後以 TOOL_LIMIT 終止。範圍 1–1000。",
			retryCount: "重試次數",
			retryCountHint: "符合狀態碼時允許的額外請求次數。預設 0（關閉），啟用後可能重複 Cursor 遠端模型請求或用量。範圍 0–10。",
			retryInterval: "重試間隔（毫秒）",
			retryIntervalHint: "每次 HTTP 重試前等待的固定時間。範圍 0–300000。",
			retryStatuses: "重試 HTTP 狀態碼",
			retryStatusesHint: "以逗號分隔，例如 408, 425, 429, 500, 502, 503, 504。",
			replayHistoryEachStep: "每步重放完整歷史",
			replayHistoryEachStepHint: "每一步都從 DSH 的對話歷史重建 Cursor 工作階段，而不是沿用 Cursor 伺服器端保存的工作階段。模型因此始終看到完整歷史，代價是 token 隨步數成長。預設關閉。",
			saveSettings: "儲存設定",
			savingSettings: "儲存中…",
			reloadSettings: "重新載入",
			loadingSettings: "載入中…",
			settingsSaved: "設定已儲存。",
			settingsLoadFailed: "無法讀取執行設定。",
			settingsSaveFailed: "無法儲存執行設定。",
			settingsInvalid: "請檢查工具輪次、重試次數、間隔和 HTTP 狀態碼。",
		};
		const ja = {
			nav: "Cursor",
			title: "Cursor サブスクリプション",
			connected: "サインイン済み",
			disconnected: "未サインイン",
			accountLoading: "アカウント状態を読み込み中…",
			login: "ブラウザーでサインイン",
			logout: "サインアウト",
			cancel: "キャンセル",
			openLogin: "サインインページを開く",
			waiting: "サインインの完了を待っています…",
			failed: "サインインに失敗しました。もう一度お試しください。",
			loadFailed: "Cursor の状態を読み取れませんでした。",
			note: "ブラウザーで Cursor アカウントにサインインすると、モデル選択で Cursor サブスクリプションのモデルを利用できます。認証情報はこのマシン内にのみ保存されます。",
			expiresAt: "トークン有効期限 {value}",
			usage: "サブスクリプション使用量",
			usageRefresh: "更新",
			usageRefreshing: "更新中…",
			usageNotSignedIn: "サインインすると Cursor が報告する使用量を確認できます。",
			usageLoading: "使用量を読み込み中…",
			usageUpdated: "{value} に更新",
			usageItem: "項目",
			usageTokens: "トークン",
			usagePercent: "使用量",
			autoOverflow: "auto（オーバーフロー）",
			modelUsage: "モデル使用量",
			plan: "プラン",
			unlimited: "無制限",
			includedRequests: "含まれるリクエスト",
			requestsUsed: "{used} / {limit} リクエスト使用（{pct}%）",
			onDemandSpend: "オンデマンド利用額",
			autoUsage: "プランの Cursor モデル使用量",
			otherModels: "プランのその他モデル使用量",
			spendUsedOf: "${used} / ${limit} 使用",
			billingCycle: "請求サイクル",
			billingDaysLeft: "残り {value} 日",
			models: "モデル",
			modelsRefresh: "モデルを更新",
			modelsRefreshing: "更新中…",
			modelsCount: "{value} 個のモデル",
			modelsLoading: "モデル一覧を読み込み中…",
			runtimeSettings: "実行設定",
			runtimeSettingsNote: "設定は現在の DSH profile に保存され、次回の Cursor リクエストから適用されます。",
			maxToolRounds: "最大ツールラウンド",
			maxToolRoundsHint: "1 回の Cursor タスクで許可されるツールラウンド数。超えると TOOL_LIMIT で終了します。範囲: 1〜1000。",
			retryCount: "リトライ回数",
			retryCountHint: "該当するステータスに対する追加リクエスト回数。既定 0（無効）。有効にすると Cursor のリモートモデル処理や使用量が重複する場合があります。範囲: 0〜10。",
			retryInterval: "リトライ間隔（ミリ秒）",
			retryIntervalHint: "各 HTTP リトライ前の固定待機時間。範囲: 0〜300000。",
			retryStatuses: "リトライする HTTP ステータスコード",
			retryStatusesHint: "カンマ区切り、例: 408, 425, 429, 500, 502, 503, 504。",
			replayHistoryEachStep: "毎ステップで履歴全体を再送",
			replayHistoryEachStepHint: "毎ステップ、DSH の会話履歴から Cursor の会話を再構築し、Cursor サーバー側の会話を再利用しません。モデルは常に完全な履歴を見られますが、トークン消費はステップ数とともに増えます。既定はオフ。",
			saveSettings: "設定を保存",
			savingSettings: "保存中…",
			reloadSettings: "再読み込み",
			loadingSettings: "読み込み中…",
			settingsSaved: "設定を保存しました。",
			settingsLoadFailed: "実行設定を読み取れませんでした。",
			settingsSaveFailed: "実行設定を保存できませんでした。",
			settingsInvalid: "ツールラウンド、リトライ回数、間隔、HTTP ステータスコードを確認してください。",
		};
		const ko = {
			nav: "Cursor",
			title: "Cursor 구독",
			connected: "로그인됨",
			disconnected: "로그인하지 않음",
			accountLoading: "계정 상태를 불러오는 중…",
			login: "브라우저로 로그인",
			logout: "로그아웃",
			cancel: "취소",
			openLogin: "로그인 페이지 열기",
			waiting: "로그인 완료를 기다리는 중…",
			failed: "로그인에 실패했습니다. 다시 시도하세요.",
			loadFailed: "Cursor 상태를 읽을 수 없습니다.",
			note: "브라우저에서 Cursor 계정으로 로그인하면 모델 선택기에서 Cursor 구독 모델을 사용할 수 있습니다. 자격 증명은 이 컴퓨터에만 저장됩니다.",
			expiresAt: "토큰 만료 {value}",
			usage: "구독 사용량",
			usageRefresh: "새로 고침",
			usageRefreshing: "새로 고치는 중…",
			usageNotSignedIn: "로그인하면 Cursor가 보고하는 사용량을 볼 수 있습니다.",
			usageLoading: "사용량을 불러오는 중…",
			usageUpdated: "{value}에 업데이트",
			usageItem: "항목",
			usageTokens: "토큰",
			usagePercent: "사용량",
			autoOverflow: "auto(오버플로)",
			modelUsage: "모델 사용량",
			plan: "플랜",
			unlimited: "무제한",
			includedRequests: "포함된 요청",
			requestsUsed: "요청 {used} / {limit} 사용 ({pct}%)",
			onDemandSpend: "종량제 지출",
			autoUsage: "플랜 Cursor 모델 사용량",
			otherModels: "플랜 기타 모델 사용량",
			spendUsedOf: "${used} / ${limit} 사용",
			billingCycle: "결제 주기",
			billingDaysLeft: "{value}일 남음",
			models: "모델",
			modelsRefresh: "모델 새로 고침",
			modelsRefreshing: "새로 고치는 중…",
			modelsCount: "모델 {value}개",
			modelsLoading: "모델 목록을 불러오는 중…",
			runtimeSettings: "실행 설정",
			runtimeSettingsNote: "설정은 현재 DSH profile에 저장되며 다음 Cursor 요청부터 적용됩니다.",
			maxToolRounds: "최대 도구 라운드",
			maxToolRoundsHint: "Cursor 작업 하나에서 허용되는 도구 라운드 수이며 초과하면 TOOL_LIMIT으로 종료됩니다. 범위: 1–1000.",
			retryCount: "재시도 횟수",
			retryCountHint: "일치하는 상태 코드에 대한 추가 요청 횟수. 기본값 0(해제). 사용하면 Cursor 원격 모델 작업이나 사용량이 중복될 수 있습니다. 범위: 0–10.",
			retryInterval: "재시도 간격(ms)",
			retryIntervalHint: "각 HTTP 재시도 전에 기다리는 고정 시간. 범위: 0–300000.",
			retryStatuses: "재시도할 HTTP 상태 코드",
			retryStatusesHint: "쉼표로 구분합니다. 예: 408, 425, 429, 500, 502, 503, 504.",
			replayHistoryEachStep: "매 단계 전체 기록 재전송",
			replayHistoryEachStepHint: "매 단계마다 DSH 대화 기록에서 Cursor 대화를 다시 구성하고 Cursor 서버가 보관한 대화를 재사용하지 않습니다. 모델은 항상 전체 기록을 보지만 토큰 사용량이 단계 수에 따라 늘어납니다. 기본값은 꺼짐.",
			saveSettings: "설정 저장",
			savingSettings: "저장 중…",
			reloadSettings: "다시 불러오기",
			loadingSettings: "불러오는 중…",
			settingsSaved: "설정을 저장했습니다.",
			settingsLoadFailed: "실행 설정을 읽을 수 없습니다.",
			settingsSaveFailed: "실행 설정을 저장할 수 없습니다.",
			settingsInvalid: "도구 라운드, 재시도 횟수, 간격, HTTP 상태 코드를 확인하세요.",
		};
		const es = {
			nav: "Cursor",
			title: "Suscripción a Cursor",
			connected: "Sesión iniciada",
			disconnected: "Sin sesión",
			accountLoading: "Leyendo el estado de la cuenta…",
			login: "Iniciar sesión en el navegador",
			logout: "Cerrar sesión",
			cancel: "Cancelar",
			openLogin: "Abrir la página de inicio de sesión",
			waiting: "Esperando a que termine el inicio de sesión…",
			failed: "No se pudo iniciar sesión. Inténtalo de nuevo.",
			loadFailed: "No se pudo leer el estado de Cursor.",
			note: "Después de iniciar sesión con una cuenta de Cursor en el navegador, los modelos de la suscripción a Cursor estarán disponibles en el selector de modelos. Las credenciales permanecen en este equipo.",
			expiresAt: "Token válido hasta {value}",
			usage: "Uso de la suscripción",
			usageRefresh: "Actualizar",
			usageRefreshing: "Actualizando…",
			usageNotSignedIn: "Inicia sesión para ver el uso que informa Cursor.",
			usageLoading: "Leyendo el uso…",
			usageUpdated: "Actualizado {value}",
			usageItem: "Elemento",
			usageTokens: "Tokens",
			usagePercent: "Uso",
			autoOverflow: "auto (desbordamiento)",
			modelUsage: "Uso por modelo",
			plan: "Plan",
			unlimited: "Ilimitado",
			includedRequests: "Solicitudes incluidas",
			requestsUsed: "{used} / {limit} solicitudes usadas ({pct}%)",
			onDemandSpend: "Gasto bajo demanda",
			autoUsage: "Uso de modelos Cursor del plan",
			otherModels: "Uso de otros modelos del plan",
			spendUsedOf: "${used} / ${limit} gastados",
			billingCycle: "Ciclo de facturación",
			billingDaysLeft: "Quedan {value} días",
			models: "Modelos",
			modelsRefresh: "Actualizar modelos",
			modelsRefreshing: "Actualizando…",
			modelsCount: "{value} modelos",
			modelsLoading: "Leyendo la lista de modelos…",
			runtimeSettings: "Ajustes de ejecución",
			runtimeSettingsNote: "Los ajustes se guardan en el profile de DSH actual y se aplican desde la siguiente solicitud a Cursor.",
			maxToolRounds: "Rondas de herramientas máximas",
			maxToolRoundsHint: "Rondas de herramientas permitidas en una tarea de Cursor antes de que TOOL_LIMIT la detenga. Rango: 1–1000.",
			retryCount: "Número de reintentos",
			retryCountHint: "Intentos adicionales para los estados coincidentes. Predeterminado: 0 (desactivado). Activar los reintentos puede repetir trabajo o uso del modelo remoto de Cursor. Rango: 0–10.",
			retryInterval: "Intervalo de reintento (ms)",
			retryIntervalHint: "Espera fija antes de cada reintento HTTP. Rango: 0–300000.",
			retryStatuses: "Códigos de estado HTTP con reintento",
			retryStatusesHint: "Separados por comas, por ejemplo: 408, 425, 429, 500, 502, 503, 504.",
			replayHistoryEachStep: "Repetir todo el historial en cada paso",
			replayHistoryEachStepHint: "Reconstruye la conversación de Cursor desde el historial de DSH en cada paso en lugar de reutilizar la que Cursor guarda en el servidor, de modo que el modelo siempre ve el historial completo. El coste es que los tokens crecen con los pasos. Predeterminado: desactivado.",
			saveSettings: "Guardar ajustes",
			savingSettings: "Guardando…",
			reloadSettings: "Recargar",
			loadingSettings: "Cargando…",
			settingsSaved: "Ajustes guardados.",
			settingsLoadFailed: "No se pudieron leer los ajustes de ejecución.",
			settingsSaveFailed: "No se pudieron guardar los ajustes de ejecución.",
			settingsInvalid: "Comprueba las rondas de herramientas, los reintentos, el intervalo y los códigos de estado HTTP.",
		};
		const fr = {
			nav: "Cursor",
			title: "Abonnement Cursor",
			connected: "Connecté",
			disconnected: "Non connecté",
			accountLoading: "Lecture de l'état du compte…",
			login: "Se connecter via le navigateur",
			logout: "Se déconnecter",
			cancel: "Annuler",
			openLogin: "Ouvrir la page de connexion",
			waiting: "En attente de la fin de la connexion…",
			failed: "Échec de la connexion. Réessayez.",
			loadFailed: "Impossible de lire l'état de Cursor.",
			note: "Après vous être connecté à un compte Cursor dans le navigateur, les modèles de l'abonnement Cursor apparaissent dans le sélecteur de modèles. Les identifiants restent sur cette machine.",
			expiresAt: "Jeton valide jusqu'au {value}",
			usage: "Utilisation de l'abonnement",
			usageRefresh: "Actualiser",
			usageRefreshing: "Actualisation…",
			usageNotSignedIn: "Connectez-vous pour consulter l'utilisation signalée par Cursor.",
			usageLoading: "Lecture de l'utilisation…",
			usageUpdated: "Mis à jour {value}",
			usageItem: "Élément",
			usageTokens: "Tokens",
			usagePercent: "Utilisation",
			autoOverflow: "auto (dépassement)",
			modelUsage: "Utilisation par modèle",
			plan: "Forfait",
			unlimited: "Illimité",
			includedRequests: "Requêtes incluses",
			requestsUsed: "{used} / {limit} requêtes utilisées ({pct} %)",
			onDemandSpend: "Dépenses à la demande",
			autoUsage: "Utilisation des modèles Cursor du forfait",
			otherModels: "Utilisation des autres modèles du forfait",
			spendUsedOf: "${used} / ${limit} dépensés",
			billingCycle: "Cycle de facturation",
			billingDaysLeft: "{value} jours restants",
			models: "Modèles",
			modelsRefresh: "Actualiser les modèles",
			modelsRefreshing: "Actualisation…",
			modelsCount: "{value} modèles",
			modelsLoading: "Lecture de la liste des modèles…",
			runtimeSettings: "Paramètres d'exécution",
			runtimeSettingsNote: "Les paramètres sont enregistrés dans le profile DSH actuel et s'appliquent à partir de la prochaine requête Cursor.",
			maxToolRounds: "Nombre maximal de tours d'outils",
			maxToolRoundsHint: "Tours d'outils autorisés dans une tâche Cursor avant l'arrêt par TOOL_LIMIT. Plage : 1–1000.",
			retryCount: "Nombre de tentatives",
			retryCountHint: "Tentatives supplémentaires pour les statuts correspondants. Par défaut : 0 (désactivé). Activer les tentatives peut répéter le travail ou l'utilisation du modèle Cursor distant. Plage : 0–10.",
			retryInterval: "Intervalle de nouvelle tentative (ms)",
			retryIntervalHint: "Délai fixe avant chaque nouvelle tentative HTTP. Plage : 0–300000.",
			retryStatuses: "Codes d'état HTTP à réessayer",
			retryStatusesHint: "Séparés par des virgules, par exemple : 408, 425, 429, 500, 502, 503, 504.",
			replayHistoryEachStep: "Rejouer tout l'historique à chaque étape",
			replayHistoryEachStepHint: "Reconstruit la conversation Cursor depuis l'historique DSH à chaque étape au lieu de reprendre celle conservée côté serveur Cursor : le modèle voit donc toujours l'historique complet. Le coût est que les jetons augmentent avec les étapes. Par défaut : désactivé.",
			saveSettings: "Enregistrer les paramètres",
			savingSettings: "Enregistrement…",
			reloadSettings: "Recharger",
			loadingSettings: "Chargement…",
			settingsSaved: "Paramètres enregistrés.",
			settingsLoadFailed: "Impossible de lire les paramètres d'exécution.",
			settingsSaveFailed: "Impossible d'enregistrer les paramètres d'exécution.",
			settingsInvalid: "Vérifiez les tours d'outils, le nombre de tentatives, l'intervalle et les codes d'état HTTP.",
		};
		const de = {
			nav: "Cursor",
			title: "Cursor-Abonnement",
			connected: "Angemeldet",
			disconnected: "Nicht angemeldet",
			accountLoading: "Kontostatus wird gelesen…",
			login: "Im Browser anmelden",
			logout: "Abmelden",
			cancel: "Abbrechen",
			openLogin: "Anmeldeseite öffnen",
			waiting: "Warten auf den Abschluss der Anmeldung…",
			failed: "Anmeldung fehlgeschlagen. Bitte erneut versuchen.",
			loadFailed: "Cursor-Status konnte nicht gelesen werden.",
			note: "Nach der Anmeldung mit einem Cursor-Konto im Browser stehen die Modelle des Cursor-Abonnements in der Modellauswahl bereit. Die Anmeldedaten bleiben auf diesem Rechner.",
			expiresAt: "Token gültig bis {value}",
			usage: "Abonnement-Nutzung",
			usageRefresh: "Aktualisieren",
			usageRefreshing: "Wird aktualisiert…",
			usageNotSignedIn: "Melden Sie sich an, um die von Cursor gemeldete Nutzung zu sehen.",
			usageLoading: "Nutzung wird gelesen…",
			usageUpdated: "Aktualisiert {value}",
			usageItem: "Element",
			usageTokens: "Tokens",
			usagePercent: "Nutzung",
			autoOverflow: "auto (Überlauf)",
			modelUsage: "Nutzung je Modell",
			plan: "Tarif",
			unlimited: "Unbegrenzt",
			includedRequests: "Enthaltene Anfragen",
			requestsUsed: "{used} / {limit} Anfragen verwendet ({pct} %)",
			onDemandSpend: "Nutzungsabhängige Ausgaben",
			autoUsage: "Cursor-Modellnutzung des Tarifs",
			otherModels: "Nutzung anderer Modelle des Tarifs",
			spendUsedOf: "${used} / ${limit} ausgegeben",
			billingCycle: "Abrechnungszeitraum",
			billingDaysLeft: "Noch {value} Tage",
			models: "Modelle",
			modelsRefresh: "Modelle aktualisieren",
			modelsRefreshing: "Wird aktualisiert…",
			modelsCount: "{value} Modelle",
			modelsLoading: "Modellliste wird gelesen…",
			runtimeSettings: "Laufzeiteinstellungen",
			runtimeSettingsNote: "Einstellungen werden im aktuellen DSH-profile gespeichert und gelten ab der nächsten Cursor-Anfrage.",
			maxToolRounds: "Maximale Tool-Runden",
			maxToolRoundsHint: "Erlaubte Tool-Runden in einer Cursor-Aufgabe, bevor TOOL_LIMIT abbricht. Bereich: 1–1000.",
			retryCount: "Anzahl der Wiederholungen",
			retryCountHint: "Zusätzliche Versuche bei passenden Statuscodes. Standard: 0 (aus). Aktivierte Wiederholungen können Remote-Arbeit oder Nutzung des Cursor-Modells duplizieren. Bereich: 0–10.",
			retryInterval: "Wiederholungsintervall (ms)",
			retryIntervalHint: "Feste Wartezeit vor jedem HTTP-Wiederholungsversuch. Bereich: 0–300000.",
			retryStatuses: "HTTP-Statuscodes für Wiederholung",
			retryStatusesHint: "Kommagetrennt, zum Beispiel: 408, 425, 429, 500, 502, 503, 504.",
			replayHistoryEachStep: "Vollständigen Verlauf bei jedem Schritt senden",
			replayHistoryEachStepHint: "Baut die Cursor-Konversation bei jedem Schritt aus dem DSH-Verlauf neu auf, statt die serverseitig gespeicherte fortzuführen; das Modell sieht damit stets den vollständigen Verlauf. Die Kosten sind mit der Schrittzahl wachsende Tokens. Standard: aus.",
			saveSettings: "Einstellungen speichern",
			savingSettings: "Wird gespeichert…",
			reloadSettings: "Neu laden",
			loadingSettings: "Wird geladen…",
			settingsSaved: "Einstellungen gespeichert.",
			settingsLoadFailed: "Laufzeiteinstellungen konnten nicht gelesen werden.",
			settingsSaveFailed: "Laufzeiteinstellungen konnten nicht gespeichert werden.",
			settingsInvalid: "Prüfen Sie Tool-Runden, Anzahl der Wiederholungen, Intervall und HTTP-Statuscodes.",
		};
		const ru = {
			nav: "Cursor",
			title: "Подписка Cursor",
			connected: "Вход выполнен",
			disconnected: "Вход не выполнен",
			accountLoading: "Чтение состояния аккаунта…",
			login: "Войти через браузер",
			logout: "Выйти",
			cancel: "Отмена",
			openLogin: "Открыть страницу входа",
			waiting: "Ожидание завершения входа…",
			failed: "Не удалось войти. Повторите попытку.",
			loadFailed: "Не удалось прочитать состояние Cursor.",
			note: "После входа в аккаунт Cursor в браузере модели подписки Cursor появятся в выборе моделей. Учётные данные остаются на этом компьютере.",
			expiresAt: "Токен действителен до {value}",
			usage: "Использование подписки",
			usageRefresh: "Обновить",
			usageRefreshing: "Обновление…",
			usageNotSignedIn: "Войдите, чтобы увидеть использование, о котором сообщает Cursor.",
			usageLoading: "Чтение использования…",
			usageUpdated: "Обновлено {value}",
			usageItem: "Строка",
			usageTokens: "Токены",
			usagePercent: "Использование",
			autoOverflow: "auto (переполнение)",
			modelUsage: "Использование по моделям",
			plan: "Тариф",
			unlimited: "Без ограничений",
			includedRequests: "Включённые запросы",
			requestsUsed: "Использовано {used} / {limit} запросов ({pct}%)",
			onDemandSpend: "Расходы по требованию",
			autoUsage: "Использование моделей Cursor по тарифу",
			otherModels: "Использование других моделей по тарифу",
			spendUsedOf: "Потрачено ${used} / ${limit}",
			billingCycle: "Расчётный период",
			billingDaysLeft: "Осталось {value} дн.",
			models: "Модели",
			modelsRefresh: "Обновить модели",
			modelsRefreshing: "Обновление…",
			modelsCount: "Моделей: {value}",
			modelsLoading: "Чтение списка моделей…",
			runtimeSettings: "Параметры выполнения",
			runtimeSettingsNote: "Параметры сохраняются в текущем profile DSH и применяются со следующего запроса к Cursor.",
			maxToolRounds: "Максимум раундов инструментов",
			maxToolRoundsHint: "Раунды инструментов, разрешённые в одной задаче Cursor, после чего срабатывает TOOL_LIMIT. Диапазон: 1–1000.",
			retryCount: "Число повторов",
			retryCountHint: "Дополнительные попытки для совпадающих статусов. По умолчанию: 0 (выключено). Включение повторов может продублировать работу удалённой модели Cursor или расход. Диапазон: 0–10.",
			retryInterval: "Интервал повтора (мс)",
			retryIntervalHint: "Фиксированная задержка перед каждым повтором HTTP. Диапазон: 0–300000.",
			retryStatuses: "HTTP-статусы для повтора",
			retryStatusesHint: "Через запятую, например: 408, 425, 429, 500, 502, 503, 504.",
			replayHistoryEachStep: "Повторять всю историю на каждом шаге",
			replayHistoryEachStepHint: "Перестраивает разговор Cursor из истории DSH на каждом шаге вместо продолжения разговора, хранимого на стороне сервера Cursor, поэтому модель всегда видит полную историю. Цена — рост токенов с числом шагов. По умолчанию: выключено.",
			saveSettings: "Сохранить параметры",
			savingSettings: "Сохранение…",
			reloadSettings: "Перезагрузить",
			loadingSettings: "Загрузка…",
			settingsSaved: "Параметры сохранены.",
			settingsLoadFailed: "Не удалось прочитать параметры выполнения.",
			settingsSaveFailed: "Не удалось сохранить параметры выполнения.",
			settingsInvalid: "Проверьте раунды инструментов, число повторов, интервал и HTTP-статусы.",
		};
		const ptBr = {
			nav: "Cursor",
			title: "Assinatura do Cursor",
			connected: "Conectado",
			disconnected: "Não conectado",
			accountLoading: "Lendo o status da conta…",
			login: "Entrar pelo navegador",
			logout: "Sair",
			cancel: "Cancelar",
			openLogin: "Abrir a página de login",
			waiting: "Aguardando a conclusão do login…",
			failed: "Falha no login. Tente novamente.",
			loadFailed: "Não foi possível ler o estado do Cursor.",
			note: "Depois de entrar com uma conta Cursor no navegador, os modelos da assinatura do Cursor ficam disponíveis no seletor de modelos. As credenciais permanecem neste computador.",
			expiresAt: "Token válido até {value}",
			usage: "Uso da assinatura",
			usageRefresh: "Atualizar",
			usageRefreshing: "Atualizando…",
			usageNotSignedIn: "Entre para ver o uso informado pelo Cursor.",
			usageLoading: "Lendo o uso…",
			usageUpdated: "Atualizado em {value}",
			usageItem: "Item",
			usageTokens: "Tokens",
			usagePercent: "Uso",
			autoOverflow: "auto (excedente)",
			modelUsage: "Uso por modelo",
			plan: "Plano",
			unlimited: "Ilimitado",
			includedRequests: "Requisições incluídas",
			requestsUsed: "{used} / {limit} requisições usadas ({pct}%)",
			onDemandSpend: "Gasto sob demanda",
			autoUsage: "Uso dos modelos Cursor do plano",
			otherModels: "Uso de outros modelos do plano",
			spendUsedOf: "${used} / ${limit} gastos",
			billingCycle: "Ciclo de cobrança",
			billingDaysLeft: "{value} dias restantes",
			models: "Modelos",
			modelsRefresh: "Atualizar modelos",
			modelsRefreshing: "Atualizando…",
			modelsCount: "{value} modelos",
			modelsLoading: "Lendo a lista de modelos…",
			runtimeSettings: "Configurações de execução",
			runtimeSettingsNote: "As configurações são salvas no profile do DSH atual e valem a partir da próxima requisição ao Cursor.",
			maxToolRounds: "Máximo de rodadas de ferramentas",
			maxToolRoundsHint: "Rodadas de ferramentas permitidas em uma tarefa do Cursor antes de o TOOL_LIMIT interromper. Faixa: 1–1000.",
			retryCount: "Número de tentativas",
			retryCountHint: "Tentativas adicionais para os status correspondentes. Padrão: 0 (desativado). Ativar tentativas pode repetir trabalho ou uso do modelo remoto do Cursor. Faixa: 0–10.",
			retryInterval: "Intervalo entre tentativas (ms)",
			retryIntervalHint: "Espera fixa antes de cada nova tentativa HTTP. Faixa: 0–300000.",
			retryStatuses: "Códigos de status HTTP com nova tentativa",
			retryStatusesHint: "Separados por vírgula, por exemplo: 408, 425, 429, 500, 502, 503, 504.",
			replayHistoryEachStep: "Repetir todo o histórico a cada passo",
			replayHistoryEachStepHint: "Reconstrói a conversa do Cursor a partir do histórico do DSH a cada passo, em vez de reutilizar a que o Cursor guarda no servidor, para que o modelo veja sempre o histórico completo. O custo é que os tokens crescem com os passos. Padrão: desativado.",
			saveSettings: "Salvar configurações",
			savingSettings: "Salvando…",
			reloadSettings: "Recarregar",
			loadingSettings: "Carregando…",
			settingsSaved: "Configurações salvas.",
			settingsLoadFailed: "Não foi possível ler as configurações de execução.",
			settingsSaveFailed: "Não foi possível salvar as configurações de execução.",
			settingsInvalid: "Verifique as rodadas de ferramentas, o número de tentativas, o intervalo e os códigos de status HTTP.",
		};
		const it = {
			nav: "Cursor",
			title: "Abbonamento Cursor",
			connected: "Connesso",
			disconnected: "Non connesso",
			accountLoading: "Lettura dello stato dell'account…",
			login: "Accedi dal browser",
			logout: "Esci",
			cancel: "Annulla",
			openLogin: "Apri la pagina di accesso",
			waiting: "In attesa del completamento dell'accesso…",
			failed: "Accesso non riuscito. Riprova.",
			loadFailed: "Impossibile leggere lo stato di Cursor.",
			note: "Dopo aver eseguito l'accesso con un account Cursor nel browser, i modelli dell'abbonamento Cursor saranno disponibili nel selettore dei modelli. Le credenziali restano su questo computer.",
			expiresAt: "Token valido fino al {value}",
			usage: "Utilizzo dell'abbonamento",
			usageRefresh: "Aggiorna",
			usageRefreshing: "Aggiornamento…",
			usageNotSignedIn: "Accedi per vedere l'utilizzo comunicato da Cursor.",
			usageLoading: "Lettura dell'utilizzo…",
			usageUpdated: "Aggiornato {value}",
			usageItem: "Voce",
			usageTokens: "Token",
			usagePercent: "Utilizzo",
			autoOverflow: "auto (eccedenza)",
			modelUsage: "Utilizzo per modello",
			plan: "Piano",
			unlimited: "Illimitato",
			includedRequests: "Richieste incluse",
			requestsUsed: "{used} / {limit} richieste usate ({pct}%)",
			onDemandSpend: "Spesa on demand",
			autoUsage: "Utilizzo dei modelli Cursor del piano",
			otherModels: "Utilizzo degli altri modelli del piano",
			spendUsedOf: "${used} / ${limit} spesi",
			billingCycle: "Ciclo di fatturazione",
			billingDaysLeft: "{value} giorni rimanenti",
			models: "Modelli",
			modelsRefresh: "Aggiorna i modelli",
			modelsRefreshing: "Aggiornamento…",
			modelsCount: "{value} modelli",
			modelsLoading: "Lettura dell'elenco dei modelli…",
			runtimeSettings: "Impostazioni di esecuzione",
			runtimeSettingsNote: "Le impostazioni vengono salvate nel profile DSH corrente e si applicano dalla successiva richiesta a Cursor.",
			maxToolRounds: "Numero massimo di round di strumenti",
			maxToolRoundsHint: "Round di strumenti consentiti in un'attività Cursor prima che TOOL_LIMIT la interrompa. Intervallo: 1–1000.",
			retryCount: "Numero di tentativi",
			retryCountHint: "Tentativi aggiuntivi per gli stati corrispondenti. Predefinito: 0 (disattivato). Attivare i tentativi può ripetere lavoro o utilizzo del modello Cursor remoto. Intervallo: 0–10.",
			retryInterval: "Intervallo tra tentativi (ms)",
			retryIntervalHint: "Attesa fissa prima di ogni nuovo tentativo HTTP. Intervallo: 0–300000.",
			retryStatuses: "Codici di stato HTTP da ritentare",
			retryStatusesHint: "Separati da virgole, ad esempio: 408, 425, 429, 500, 502, 503, 504.",
			replayHistoryEachStep: "Ripeti tutta la cronologia a ogni passo",
			replayHistoryEachStepHint: "Ricostruisce la conversazione Cursor dalla cronologia DSH a ogni passo invece di riprendere quella conservata sul server Cursor, così il modello vede sempre la cronologia completa. Il costo è che i token crescono con i passi. Predefinito: disattivato.",
			saveSettings: "Salva impostazioni",
			savingSettings: "Salvataggio…",
			reloadSettings: "Ricarica",
			loadingSettings: "Caricamento…",
			settingsSaved: "Impostazioni salvate.",
			settingsLoadFailed: "Impossibile leggere le impostazioni di esecuzione.",
			settingsSaveFailed: "Impossibile salvare le impostazioni di esecuzione.",
			settingsInvalid: "Controlla i round di strumenti, il numero di tentativi, l'intervallo e i codici di stato HTTP.",
		};
		const ar = {
			nav: "Cursor",
			title: "اشتراك Cursor",
			connected: "تم تسجيل الدخول",
			disconnected: "لم يتم تسجيل الدخول",
			accountLoading: "جارٍ قراءة حالة الحساب…",
			login: "تسجيل الدخول عبر المتصفح",
			logout: "تسجيل الخروج",
			cancel: "إلغاء",
			openLogin: "فتح صفحة تسجيل الدخول",
			waiting: "في انتظار اكتمال تسجيل الدخول…",
			failed: "فشل تسجيل الدخول. حاول مرة أخرى.",
			loadFailed: "تعذّر قراءة حالة Cursor.",
			note: "بعد تسجيل الدخول بحساب Cursor في المتصفح، تصبح نماذج اشتراك Cursor متاحة في منتقي النماذج. تبقى بيانات الاعتماد على هذا الجهاز.",
			expiresAt: "الرمز صالح حتى {value}",
			usage: "استخدام الاشتراك",
			usageRefresh: "تحديث",
			usageRefreshing: "جارٍ التحديث…",
			usageNotSignedIn: "سجّل الدخول لعرض الاستخدام الذي يبلّغ عنه Cursor.",
			usageLoading: "جارٍ قراءة الاستخدام…",
			usageUpdated: "حُدّث في {value}",
			usageItem: "البند",
			usageTokens: "الرموز",
			usagePercent: "الاستخدام",
			autoOverflow: "auto (تجاوز)",
			modelUsage: "الاستخدام حسب النموذج",
			plan: "الخطة",
			unlimited: "غير محدود",
			includedRequests: "الطلبات المضمّنة",
			requestsUsed: "استُخدم {used} / {limit} طلبًا ({pct}%)",
			onDemandSpend: "الإنفاق عند الطلب",
			autoUsage: "استخدام نماذج Cursor في الخطة",
			otherModels: "استخدام النماذج الأخرى في الخطة",
			spendUsedOf: "أُنفق ${used} / ${limit}",
			billingCycle: "دورة الفوترة",
			billingDaysLeft: "بقي {value} يومًا",
			models: "النماذج",
			modelsRefresh: "تحديث النماذج",
			modelsRefreshing: "جارٍ التحديث…",
			modelsCount: "{value} نموذجًا",
			modelsLoading: "جارٍ قراءة قائمة النماذج…",
			runtimeSettings: "إعدادات التشغيل",
			runtimeSettingsNote: "تُحفظ الإعدادات في profile DSH الحالي وتُطبَّق بدءًا من طلب Cursor التالي.",
			maxToolRounds: "الحد الأقصى لجولات الأدوات",
			maxToolRoundsHint: "جولات الأدوات المسموح بها في مهمة Cursor واحدة قبل أن يوقفها TOOL_LIMIT. النطاق: 1–1000.",
			retryCount: "عدد المحاولات",
			retryCountHint: "محاولات إضافية لحالات الاستجابة المطابقة. الافتراضي: 0 (معطّل). قد يؤدي تفعيل المحاولات إلى تكرار عمل النموذج البعيد في Cursor أو استخدامه. النطاق: 0–10.",
			retryInterval: "الفاصل بين المحاولات (مللي ثانية)",
			retryIntervalHint: "انتظار ثابت قبل كل محاولة HTTP جديدة. النطاق: 0–300000.",
			retryStatuses: "رموز حالة HTTP المُعاد المحاولة فيها",
			retryStatusesHint: "مفصولة بفواصل، مثل: 408, 425, 429, 500, 502, 503, 504.",
			replayHistoryEachStep: "إعادة إرسال السجل الكامل في كل خطوة",
			replayHistoryEachStepHint: "يعيد بناء محادثة Cursor من سجل DSH في كل خطوة بدلًا من متابعة المحادثة المحفوظة على خادم Cursor، ليرى النموذج السجل الكامل دائمًا. والتكلفة أن الرموز تزداد مع عدد الخطوات. الافتراضي: معطّل.",
			saveSettings: "حفظ الإعدادات",
			savingSettings: "جارٍ الحفظ…",
			reloadSettings: "إعادة التحميل",
			loadingSettings: "جارٍ التحميل…",
			settingsSaved: "تم حفظ الإعدادات.",
			settingsLoadFailed: "تعذّر قراءة إعدادات التشغيل.",
			settingsSaveFailed: "تعذّر حفظ إعدادات التشغيل.",
			settingsInvalid: "تحقق من جولات الأدوات وعدد المحاولات والفاصل ورموز حالة HTTP.",
		};

		/** Every dictionary carries the same key set as `en`; a test enforces it. */
		const DICTIONARIES = {
			zh,
			en,
			"zh-Hant": zhHant,
			ja,
			ko,
			es,
			fr,
			de,
			it,
			"pt-BR": ptBr,
			ru,
			ar,
		};

		/**
		 * Languages this panel contributes to the DSH catalog. DSH ships `zh` and
		 * `en` only, so every other language joins the shared catalog through
		 * `locale.addLanguage` and then appears in Settings -> General -> Language.
		 * Each one falls back to `en`, which keeps the rest of the DSH shell
		 * readable for a reader of a contributed language.
		 */
		const LANGUAGES = [
			{ id: "zh-Hant", label: "繁體中文", fallback: "zh" },
			{ id: "ja", label: "日本語", fallback: "en" },
			{ id: "ko", label: "한국어", fallback: "en" },
			{ id: "es", label: "Español", fallback: "en" },
			{ id: "fr", label: "Français", fallback: "en" },
			{ id: "de", label: "Deutsch", fallback: "en" },
			{ id: "it", label: "Italiano", fallback: "en" },
			{ id: "pt-BR", label: "Português (Brasil)", fallback: "en" },
			{ id: "ru", label: "Русский", fallback: "en" },
			{ id: "ar", label: "العربية", fallback: "en" },
		];

		/** Contributed locales written right to left; the panel mirrors for these. */
		const RTL_LOCALES = new Set(["ar"]);
		/** Marker the stylesheet keys the mirrored rules on. */
		const RTL_ATTRIBUTE = "cursorSubscriptionRtl";

		const STYLE = `
.cursorSubscription{display:flex;flex-direction:column;gap:10px;max-width:720px;color:var(--dsw-alias-label-primary);container-type:inline-size}
.cursorSubscription h2,.cursorSubscription h3,.cursorSubscription p{margin:0}
.cursorSubscriptionHead{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cursorSubscription h2{font-size:16px;line-height:24px;font-weight:500}
.cursorSubscription h3{font-size:14px;line-height:22px;font-weight:500}
.cursorSubscriptionCard{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:14px 16px;display:flex;flex-direction:column;gap:12px}
.cursorSubscriptionAccountRow{display:flex;align-items:center;justify-content:space-between;gap:12px}
.cursorSubscriptionStatus{display:flex;align-items:center;gap:8px;font-size:14px;line-height:22px;font-weight:500}
.cursorSubscriptionDot{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-label-dimmed)}
.cursorSubscriptionDot[data-state=connected]{background:var(--dsw-alias-state-success-primary)}
.cursorSubscriptionDot[data-state=disconnected]{background:var(--dsw-alias-state-error-primary)}
.cursorSubscriptionActions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cursorSubscriptionFlow{display:flex;flex-direction:column;gap:10px;padding:12px 14px;border-radius:10px;background:var(--dsw-alias-bg-module-platform)}
.cursorSubscriptionFlow p{font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.cursorSubscriptionError{font-size:13px;line-height:20px;color:var(--dsw-alias-state-error-primary)}
.cursorSubscriptionNote{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.cursorSubscriptionVersion{font:500 11px/17px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--dsw-alias-label-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:1px 6px;direction:ltr}
.cursorSubscriptionFreshness{font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary)}
.cursorSubscriptionSectionHead{display:flex;align-items:center;justify-content:space-between;gap:12px}
.cursorSubscriptionSectionTitle{display:flex;flex:1;min-width:0;flex-direction:column;gap:2px}
.cursorSubscriptionRefresh{flex:0 0 auto;min-width:72px;width:max-content;white-space:nowrap!important;word-break:keep-all!important;overflow-wrap:normal!important;writing-mode:horizontal-tb!important}
.cursorSubscriptionRefresh *{white-space:nowrap!important;word-break:keep-all!important;writing-mode:horizontal-tb!important}
.cursorSubscriptionEmpty{padding:18px;border:1px dashed var(--dsw-alias-border-l3);border-radius:10px;text-align:center;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary)}
.cursorSubscriptionUsageRow{display:flex;flex-direction:column;gap:6px}
.cursorSubscriptionUsageTop{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.cursorSubscriptionUsageLabel{flex:1;min-width:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.cursorSubscriptionUsageTop strong{font:600 16px/22px ui-monospace,SFMono-Regular,Consolas,monospace;font-variant-numeric:tabular-nums}
.cursorSubscriptionUsageRow progress{width:100%;height:6px;border:0;border-radius:999px;overflow:hidden;background:var(--dsw-alias-border-l3);accent-color:var(--dsw-alias-brand-primary,#3964fe);-webkit-appearance:none;appearance:none}
.cursorSubscriptionUsageRow progress::-webkit-progress-bar{background:var(--dsw-alias-border-l3);border-radius:999px}
.cursorSubscriptionUsageRow progress::-webkit-progress-value{background:var(--dsw-alias-brand-primary,#3964fe);border-radius:999px}
.cursorSubscriptionUsageRow progress::-moz-progress-bar{background:var(--dsw-alias-brand-primary,#3964fe);border-radius:999px}
.cursorSubscriptionModelUsage{display:flex;flex-direction:column;gap:10px;padding-top:4px}
.cursorSubscriptionModelUsageHead{font-size:12px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.cursorSubscriptionUsageTable{width:100%;border-collapse:collapse;font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}
.cursorSubscriptionUsageTable th,.cursorSubscriptionUsageTable td{border-top:1px solid var(--dsw-alias-border-l2);padding:6px 8px;text-align:left;font-weight:400;color:var(--dsw-alias-label-secondary)}
.cursorSubscriptionUsageTable thead th{border-top:0;padding-bottom:2px;font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary)}
.cursorSubscriptionUsagePoolRow th,.cursorSubscriptionUsagePoolRow td{font-weight:500;color:var(--dsw-alias-label-primary)}
.cursorSubscriptionUsageModelRow th{padding-left:22px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
.cursorSubscriptionUsageNumber{text-align:right}
.cursorSubscriptionMetaRow{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary)}
.cursorSubscriptionModels{display:flex;flex-direction:column;gap:8px}
.cursorSubscriptionModelChips{display:flex;flex-wrap:wrap;gap:6px}
.cursorSubscriptionModelChip{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-module-platform);padding:3px 8px;font:500 12px/18px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--dsw-alias-label-secondary);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cursorSubscriptionSettingsGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.cursorSubscriptionField{display:flex;flex-direction:column;gap:5px;min-width:0}
.cursorSubscriptionFieldWide{grid-column:1/-1}
.cursorSubscriptionField label{font-size:12px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.cursorSubscriptionField input:not([type="checkbox"]){box-sizing:border-box;width:100%;height:34px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);padding:6px 9px;color:var(--dsw-alias-label-primary);font:13px/20px ui-monospace,SFMono-Regular,Consolas,monospace;outline:none}
.cursorSubscriptionField input:not([type="checkbox"]):focus{border-color:var(--dsw-alias-brand-primary,#3964fe);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary,#3964fe) 18%,transparent)}
.cursorSubscriptionField input:not([type="checkbox"]):disabled{opacity:.6}
.cursorSubscriptionFieldHint{font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary)}
.cursorSubscriptionFieldCheckbox{gap:6px}
.cursorSubscriptionCheckboxRow{display:flex;align-items:center;gap:6px;min-width:0;cursor:pointer}
.cursorSubscriptionCheckboxRow input[type="checkbox"]{flex:0 0 auto;width:16px;height:16px;margin:0;accent-color:var(--dsw-alias-brand-primary,#3964fe);cursor:inherit}
.cursorSubscriptionCheckboxRow input[type="checkbox"]:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#3964fe);outline-offset:2px}
.cursorSubscriptionCheckboxRow:has(input:disabled){cursor:default;opacity:.5}
.cursorSubscriptionCheckboxRow label{font-size:14px;line-height:20px;font-weight:500;color:var(--dsw-alias-label-primary);cursor:inherit;min-width:0}
.cursorSubscriptionFieldCheckbox .cursorSubscriptionFieldHint{padding-inline-start:22px}
.cursorSubscriptionSettingsFoot{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.cursorSubscriptionSuccess{font-size:12px;line-height:18px;color:var(--dsw-alias-state-success-primary)}
html[data-cursor-subscription-rtl] .cursorSubscription{direction:rtl}
html[data-cursor-subscription-rtl] .cursorSubscriptionUsageRow progress{direction:rtl}
html[data-cursor-subscription-rtl] .cursorSubscriptionUsageNumber{text-align:left}
html[data-cursor-subscription-rtl] .cursorSubscriptionUsageModelRow th{padding-left:8px;padding-right:22px}
html[data-cursor-subscription-rtl] .cursorSubscriptionField input:not([type="checkbox"]){direction:ltr;text-align:left}
html[data-cursor-subscription-rtl] .cursorSubscriptionModelChip{direction:ltr}
@container (max-width:520px){.cursorSubscriptionSettingsGrid{grid-template-columns:1fr}.cursorSubscriptionFieldWide{grid-column:auto}}
`;

		const unwrap = (response) => {
			if (!response?.ok) throw new Error(response?.error?.message ?? "Cursor RPC failed");
			return response.value;
		};
		/**
		 * Label one reported build version for the panel header.
		 * @param value - version string reported by the Host.
		 * @returns the `v`-prefixed label, or undefined when nothing usable was reported.
		 */
		const formatVersion = (value) => (typeof value === "string" && value.trim() !== "" ? `v${value.trim()}` : undefined);
		/**
		 * Read the serving build's version through the account channel.
		 * @param rpc - connection RPC client bound to this panel.
		 * @returns the label, or undefined when the call fails or answers without a version.
		 */
		const readVersion = async (rpc) => {
			try {
				const response = await rpc.call(CHANNEL, "version", {});
				return response?.ok ? formatVersion(response.value?.version) : undefined;
			} catch {
				return undefined;
			}
		};
		const fill = (text, values) => Object.entries(values).reduce((next, [key, value]) => next.replace(`{${key}}`, String(value)), text);
		const validDate = (value) => {
			const date = new Date(value);
			return Number.isFinite(date.getTime()) ? date : undefined;
		};
		const percent = (value) => Number(value).toLocaleString(void 0, { maximumFractionDigits: 1 });
		/** Cursor's usage table prints one decimal even at zero (`0.0%`). */
		const percent1 = (value) => Number(value).toLocaleString(void 0, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
		/** Token counts are shown compact in the reader's locale (`2698.7万`, `27.1M`). */
		const compactTokens = (value) => Number(value).toLocaleString(void 0, { notation: "compact", maximumFractionDigits: 1 });
		const money = (value) => Number(value).toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

		/**
		 * Build the included-usage table's rows the way Cursor's dashboard lays
		 * them out: a Cursor Models row and an Other Models row, each followed by
		 * the models that drew on that pool. A pool row keeps its reported
		 * percentage even when the model list could not be read; a model row keeps
		 * its dollar spend as a tooltip.
		 */
		function includedUsageRows(t, usage, models) {
			const pools = usage?.pools ?? {};
			const rows = [];
			for (const pool of ["auto", "api"]) {
				const facts = pools[pool];
				const children = models.filter((model) => model.pool === pool);
				if (facts === undefined && children.length === 0) continue;
				rows.push({
					key: pool,
					pool: true,
					label: pool === "auto" ? t("autoUsage") : t("otherModels"),
					pct: facts?.pct,
					tokens: facts?.tokens,
				});
				for (const model of children) {
					rows.push({
						key: `${pool}:${model.id}`,
						pool: false,
						label: model.overflow === true ? t("autoOverflow") : model.id,
						pct: model.pct,
						tokens: model.tokens,
						title: typeof model.spentDollars === "number" ? `$${money(model.spentDollars)}` : undefined,
					});
				}
			}
			return rows;
		}

		function AccountCard({ rpc, t, account, setAccount, onSignedOut }) {
			const [flow, setFlow] = react.useState();
			const [busy, setBusy] = react.useState(false);
			const [error, setError] = react.useState();
			const call = (endpoint, payload = {}) => rpc.call(CHANNEL, endpoint, payload).then(unwrap);
			react.useEffect(() => {
				if (flow?.id === undefined || ["authenticated", "failed", "cancelled"].includes(flow.phase)) return undefined;
				const timer = window.setInterval(() => {
					call("login/status", { id: flow.id })
						.then((next) => {
							setFlow(next);
							if (next.phase === "authenticated") {
								call("status").then(setAccount).catch(() => setError(t("failed")));
							}
						})
						.catch(() => setError(t("failed")));
				}, 1200);
				return () => window.clearInterval(timer);
			}, [flow?.id, flow?.phase]);
			const begin = () => {
				setBusy(true);
				setError(undefined);
				call("login/start", { openExternal: true })
					.then(setFlow)
					.catch(() => setError(t("failed")))
					.finally(() => setBusy(false));
			};
			const cancel = () => {
				if (flow?.id === undefined) return;
				setBusy(true);
				call("login/cancel", { id: flow.id })
					.then(setFlow)
					.finally(() => setBusy(false));
			};
			const logout = () => {
				setBusy(true);
				setError(undefined);
				call("logout")
					.then((next) => {
						setAccount(next);
						setFlow(undefined);
						onSignedOut();
					})
					.catch(() => setError(t("failed")))
					.finally(() => setBusy(false));
			};
			const signedIn = account?.authenticated === true;
			const accountReady = account !== undefined;
			const expiresAt = Number.isFinite(account?.expiresAt) ? new Date(account.expiresAt) : undefined;
			return react_jsx_runtime.jsxs("div", {
				className: "cursorSubscriptionCard",
				children: [
					react_jsx_runtime.jsxs("div", {
						className: "cursorSubscriptionAccountRow",
						children: [
							react_jsx_runtime.jsxs("div", {
								className: "cursorSubscriptionStatus",
								role: "status",
								"aria-live": "polite",
								children: [
									react_jsx_runtime.jsx("span", {
										className: "cursorSubscriptionDot",
										"data-state": accountReady ? signedIn ? "connected" : "disconnected" : "loading",
										"aria-hidden": "true",
									}),
									accountReady ? signedIn ? t("connected") : t("disconnected") : t("accountLoading"),
								],
							}),
							react_jsx_runtime.jsx("div", {
								className: "cursorSubscriptionActions",
								children: signedIn
									? react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.Button, {
											type: "button",
											variant: "outline",
											disabled: busy,
											onClick: logout,
											children: t("logout"),
										})
									: accountReady && (flow === undefined || ["failed", "cancelled"].includes(flow.phase))
										? react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.Button, {
												type: "button",
												variant: "primary",
												disabled: busy,
												onClick: begin,
												children: t("login"),
											})
										: null,
							}),
						],
					}),
					signedIn && expiresAt !== undefined
						? react_jsx_runtime.jsx("time", {
								className: "cursorSubscriptionFreshness",
								dateTime: expiresAt.toISOString(),
								children: fill(t("expiresAt"), { value: expiresAt.toLocaleString() }),
							})
						: null,
					!signedIn && flow !== undefined && ["starting", "waiting_browser", "waiting_input"].includes(flow.phase)
						? react_jsx_runtime.jsxs("div", {
								className: "cursorSubscriptionFlow",
								children: [
									react_jsx_runtime.jsx("p", { children: t("waiting") }),
									flow.authUrl === undefined
										? null
										: react_jsx_runtime.jsx("a", { href: flow.authUrl, target: "_blank", rel: "noreferrer", children: t("openLogin") }),
									react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.Button, {
										type: "button",
										variant: "outline",
										disabled: busy,
										onClick: cancel,
										children: t("cancel"),
									}),
								],
							})
						: null,
					flow?.phase === "failed" || error !== undefined
						? react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
								children: [
									react_jsx_runtime.jsx("p", { className: "cursorSubscriptionError", role: "alert", children: error ?? t("failed") }),
									flow?.detail
										? react_jsx_runtime.jsx("p", { className: "cursorSubscriptionError", children: flow.detail })
										: null,
								],
							})
						: null,
				],
			});
		}

		function UsageRow({ label, used, limit, meta }) {
			const available = typeof used === "number" && Number.isFinite(used) && typeof limit === "number" && Number.isFinite(limit) && limit > 0;
			const usedPct = available ? Math.min(100, Math.round((used / limit) * 1000) / 10) : 0;
			const headline = available ? `${percent(usedPct)}%` : "—";
			return react_jsx_runtime.jsxs("div", {
				className: "cursorSubscriptionUsageRow",
				children: [
					react_jsx_runtime.jsxs("div", {
						className: "cursorSubscriptionUsageTop",
						children: [
							react_jsx_runtime.jsx("span", { className: "cursorSubscriptionUsageLabel", children: label }),
							react_jsx_runtime.jsx("strong", { children: headline }),
						],
					}),
					react_jsx_runtime.jsx("progress", {
						max: "100",
						value: usedPct,
						"aria-label": `${label} ${headline}`,
					}),
					react_jsx_runtime.jsx("div", {
						className: "cursorSubscriptionMetaRow",
						children: [react_jsx_runtime.jsx("span", { children: meta })],
					}),
				],
			});
		}

		function UsageCard({ rpc, t, signedIn, resetKey }) {
			const [usage, setUsage] = react.useState();
			const [busy, setBusy] = react.useState(false);
			const [error, setError] = react.useState();
			const request = react.useRef(0);
			const load = (force) => {
				if (!signedIn) return;
				const id = ++request.current;
				setBusy(true);
				setError(undefined);
				rpc.call(CHANNEL, "usage", { force })
					.then(unwrap)
					.then((next) => {
						if (request.current === id) setUsage(next);
					})
					.catch((err) => {
						if (request.current === id) setError(err.message);
					})
					.finally(() => {
						if (request.current === id) setBusy(false);
					});
			};
			react.useEffect(() => {
				if (signedIn) load(false);
				else {
					request.current += 1;
					setUsage(undefined);
					setError(undefined);
					setBusy(false);
				}
				return () => {
					request.current += 1;
				};
			}, [signedIn, resetKey]);
			const fetchedAt = typeof usage?.fetchedAt === "number" ? validDate(usage.fetchedAt) : undefined;
			const ir = usage?.includedRequests;
			const teamSpend = usage?.teamOnDemand;
			const models = Array.isArray(usage?.models) ? usage.models : [];
			const includedRows = includedUsageRows(t, usage, models);
			return react_jsx_runtime.jsxs("div", {
				className: "cursorSubscriptionCard",
				children: [
					react_jsx_runtime.jsxs("div", {
						className: "cursorSubscriptionSectionHead",
						children: [
							react_jsx_runtime.jsxs("div", {
								className: "cursorSubscriptionSectionTitle",
								children: [
									react_jsx_runtime.jsx("h3", { children: t("usage") }),
									fetchedAt === undefined
										? null
										: react_jsx_runtime.jsx("time", {
												className: "cursorSubscriptionFreshness",
												dateTime: fetchedAt.toISOString(),
												children: fill(t("usageUpdated"), { value: fetchedAt.toLocaleString() }),
											}),
								],
							}),
							react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.Button, {
								className: "cursorSubscriptionRefresh",
								type: "button",
								variant: "outline",
								disabled: !signedIn || busy,
								"aria-busy": busy,
								onClick: () => load(true),
								children: busy ? t("usageRefreshing") : t("usageRefresh"),
							}),
						],
					}),
					react_jsx_runtime.jsxs("div", {
						"aria-live": "polite",
						children: [
							!signedIn
								? react_jsx_runtime.jsx("p", { className: "cursorSubscriptionEmpty", children: t("usageNotSignedIn") })
								: null,
							signedIn && busy && usage == null
								? react_jsx_runtime.jsx("p", { className: "cursorSubscriptionEmpty", role: "status", children: t("usageLoading") })
								: null,
						],
					}),
					error === undefined
						? null
						: react_jsx_runtime.jsx("p", { className: "cursorSubscriptionError", role: "alert", children: error }),
					usage == null || !signedIn
						? null
						: react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
								children: [
									usage.isUnlimited === true
										? react_jsx_runtime.jsxs("div", {
												className: "cursorSubscriptionUsageRow",
												children: [
													react_jsx_runtime.jsxs("div", {
														className: "cursorSubscriptionUsageTop",
														children: [
															react_jsx_runtime.jsx("span", { className: "cursorSubscriptionUsageLabel", children: t("plan") }),
															react_jsx_runtime.jsx("strong", { children: t("unlimited") }),
														],
													}),
												],
											})
										: null,
									ir !== undefined && usage.isUnlimited !== true
										? react_jsx_runtime.jsx(UsageRow, {
												label: t("includedRequests"),
												used: ir.used,
												limit: ir.limit,
												meta: fill(t("requestsUsed"), { used: ir.used, limit: ir.limit, pct: percent(ir.pct) }),
											})
										: null,
									includedRows.length > 0
										? react_jsx_runtime.jsxs("div", {
												className: "cursorSubscriptionModelUsage",
												children: [
													react_jsx_runtime.jsx("span", { className: "cursorSubscriptionModelUsageHead", children: t("modelUsage") }),
													react_jsx_runtime.jsxs("table", {
														className: "cursorSubscriptionUsageTable",
														children: [
															react_jsx_runtime.jsx("thead", {
																children: react_jsx_runtime.jsxs("tr", {
																	children: [
																		react_jsx_runtime.jsx("th", { scope: "col", children: t("usageItem") }),
																		react_jsx_runtime.jsx("th", {
																			scope: "col",
																			className: "cursorSubscriptionUsageNumber",
																			children: t("usageTokens"),
																		}),
																		react_jsx_runtime.jsx("th", {
																			scope: "col",
																			className: "cursorSubscriptionUsageNumber",
																			children: t("usagePercent"),
																		}),
																	],
																}),
															}),
															react_jsx_runtime.jsx("tbody", {
																children: includedRows.map((row) =>
																	react_jsx_runtime.jsxs("tr", {
																		className: row.pool === true ? "cursorSubscriptionUsagePoolRow" : "cursorSubscriptionUsageModelRow",
																		children: [
																			react_jsx_runtime.jsx("th", { scope: "row", title: row.title, children: row.label }),
																			react_jsx_runtime.jsx("td", {
																				className: "cursorSubscriptionUsageNumber",
																				children: typeof row.tokens === "number" ? compactTokens(row.tokens) : "—",
																			}),
																			react_jsx_runtime.jsx("td", {
																				className: "cursorSubscriptionUsageNumber",
																				children: typeof row.pct === "number" ? `${percent1(row.pct)}%` : "—",
																			}),
																		],
																	}, row.key),
																),
															}),
														],
													}),
												],
											})
										: null,
									teamSpend !== undefined && teamSpend.limitDollars !== undefined
										? react_jsx_runtime.jsx(UsageRow, {
												label: t("onDemandSpend"),
												used: teamSpend.usedDollars,
												limit: teamSpend.limitDollars,
												meta: fill(t("spendUsedOf"), { used: money(teamSpend.usedDollars), limit: money(teamSpend.limitDollars) }),
											})
										: null,
									usage?.billingCycle !== undefined
										? react_jsx_runtime.jsx("div", {
												className: "cursorSubscriptionMetaRow",
												children: [
													react_jsx_runtime.jsx("span", { children: `${t("billingCycle")}: ${new Date(usage.billingCycle.start).toLocaleDateString()} – ${new Date(usage.billingCycle.end).toLocaleDateString()}` }),
													usage.billingCycle.daysLeft !== undefined
														? react_jsx_runtime.jsx("span", { children: fill(t("billingDaysLeft"), { value: usage.billingCycle.daysLeft }) })
														: null,
												],
											})
										: null,
								],
							}),
				],
			});
		}

		function ModelsCard({ rpc, t, signedIn }) {
			const [data, setData] = react.useState();
			const [busy, setBusy] = react.useState(false);
			const [error, setError] = react.useState();
			const request = react.useRef(0);
			const load = (force) => {
				if (!signedIn) return;
				const id = ++request.current;
				setBusy(true);
				setError(undefined);
				rpc.call(CHANNEL, "models", { force })
					.then(unwrap)
					.then((next) => {
						if (request.current === id) setData(next);
					})
					.catch((err) => {
						if (request.current === id) setError(err.message);
					})
					.finally(() => {
						if (request.current === id) setBusy(false);
					});
			};
			react.useEffect(() => {
				if (signedIn) load(false);
				else {
					request.current += 1;
					setData(undefined);
					setError(undefined);
					setBusy(false);
				}
				return () => {
					request.current += 1;
				};
			}, [signedIn]);
			const models = Array.isArray(data?.models) ? data.models : [];
			return react_jsx_runtime.jsxs("div", {
				className: "cursorSubscriptionCard",
				children: [
					react_jsx_runtime.jsxs("div", {
						className: "cursorSubscriptionSectionHead",
						children: [
							react_jsx_runtime.jsxs("div", {
								className: "cursorSubscriptionSectionTitle",
								children: [
									react_jsx_runtime.jsx("h3", { children: t("models") }),
									models.length > 0
										? react_jsx_runtime.jsx("span", { className: "cursorSubscriptionFreshness", children: fill(t("modelsCount"), { value: models.length }) })
										: null,
								],
							}),
							react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.Button, {
								className: "cursorSubscriptionRefresh",
								type: "button",
								variant: "outline",
								disabled: !signedIn || busy,
								"aria-busy": busy,
								onClick: () => load(true),
								children: busy ? t("modelsRefreshing") : t("modelsRefresh"),
							}),
						],
					}),
					react_jsx_runtime.jsxs("div", {
						className: "cursorSubscriptionModels",
						"aria-live": "polite",
						children: [
							!signedIn
								? react_jsx_runtime.jsx("p", { className: "cursorSubscriptionEmpty", children: t("usageNotSignedIn") })
								: null,
							signedIn && busy && models.length === 0
								? react_jsx_runtime.jsx("p", { className: "cursorSubscriptionEmpty", role: "status", children: t("modelsLoading") })
								: null,
							error === undefined
								? null
								: react_jsx_runtime.jsx("p", { className: "cursorSubscriptionError", role: "alert", children: error }),
							models.length > 0
								? react_jsx_runtime.jsx("div", {
										className: "cursorSubscriptionModelChips",
										children: models.map((model) =>
											react_jsx_runtime.jsx("span", { className: "cursorSubscriptionModelChip", title: model.name, children: model.id }),
										),
									})
								: null,
						],
					}),
				],
			});
		}

		function RuntimeSettingsCard({ rpc, t }) {
			const [form, setForm] = react.useState();
			const [baseline, setBaseline] = react.useState();
			const [busy, setBusy] = react.useState(false);
			const [error, setError] = react.useState();
			const [saved, setSaved] = react.useState(false);
			const request = react.useRef(0);
			const call = (endpoint, payload = {}) => rpc.call(CHANNEL, endpoint, payload).then(unwrap);
			const show = (value) => ({
				maxToolRounds: String(value.maxToolRounds),
				retryCount: String(value.retryCount),
				retryIntervalMs: String(value.retryIntervalMs),
				retryHttpStatusCodes: value.retryHttpStatusCodes.join(", "),
				replayHistoryEachStep: value.replayHistoryEachStep === true ? "true" : "false",
			});
			const accept = (value) => {
				setForm(show(value));
				setBaseline({
					maxToolRounds: value.maxToolRounds,
					retryCount: value.retryCount,
					retryIntervalMs: value.retryIntervalMs,
					retryHttpStatusCodes: [...value.retryHttpStatusCodes],
					replayHistoryEachStep: value.replayHistoryEachStep === true,
					revision: value.revision,
				});
			};
			const load = () => {
				const id = ++request.current;
				setBusy(true);
				setError(undefined);
				setSaved(false);
				call("settings")
					.then((value) => {
						if (request.current === id) accept(value);
					})
					.catch(() => {
						if (request.current === id) setError(t("settingsLoadFailed"));
					})
					.finally(() => {
						if (request.current === id) setBusy(false);
					});
			};
			react.useEffect(() => {
				load();
				return () => {
					request.current += 1;
				};
			}, []);
			const change = (key) => (event) => {
				const value = event.target.type === "checkbox" ? String(event.target.checked) : event.target.value;
				setForm((current) => ({ ...current, [key]: value }));
				setError(undefined);
				setSaved(false);
			};
			const parse = () => {
				const integer = (value, min, max) => {
					if (!/^\d+$/.test(value.trim())) throw new Error("invalid integer");
					const parsed = Number(value);
					if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error("integer out of range");
					return parsed;
				};
				const statusText = form.retryHttpStatusCodes.trim();
				if (statusText !== "" && !/^\d{3}(?:\s*,\s*\d{3})*$/.test(statusText)) throw new Error("invalid status list");
				const statuses = statusText === "" ? [] : statusText.split(",").map((value) => integer(value, 400, 599));
				if (new Set(statuses).size !== statuses.length) throw new Error("duplicate status");
				return {
					maxToolRounds: integer(form.maxToolRounds, 1, 1000),
					retryCount: integer(form.retryCount, 0, 10),
					retryIntervalMs: integer(form.retryIntervalMs, 0, 300000),
					retryHttpStatusCodes: statuses,
					replayHistoryEachStep: form.replayHistoryEachStep === "true",
				};
			};
			const save = () => {
				let value;
				try {
					value = parse();
				} catch {
					setError(t("settingsInvalid"));
					setSaved(false);
					return;
				}
				if (baseline === undefined) return;
				const patch = {};
				for (const key of ["maxToolRounds", "retryCount", "retryIntervalMs", "retryHttpStatusCodes", "replayHistoryEachStep"]) {
					if (JSON.stringify(value[key]) !== JSON.stringify(baseline[key])) patch[key] = value[key];
				}
				if (Object.keys(patch).length === 0) {
					setError(undefined);
					setSaved(true);
					return;
				}
				const id = ++request.current;
				setBusy(true);
				setError(undefined);
				setSaved(false);
				call("settings/update", { ...patch, revision: baseline.revision })
					.then((next) => {
						if (request.current !== id) return;
						accept(next);
						setSaved(true);
					})
					.catch(() => {
						if (request.current === id) setError(t("settingsSaveFailed"));
					})
					.finally(() => {
						if (request.current === id) setBusy(false);
					});
			};
			// A checkbox is a switch, not a text box: the box and its label share one
			// row, and the explanation sits under the pair instead of between them.
			const field = (key, label, hint, properties = {}) => {
				const className = `cursorSubscriptionField${properties.wide ? " cursorSubscriptionFieldWide" : ""}`;
				if (properties.type === "checkbox") {
					return react_jsx_runtime.jsxs("div", {
						className: `${className} cursorSubscriptionFieldCheckbox`,
						children: [
							react_jsx_runtime.jsxs("div", {
								className: "cursorSubscriptionCheckboxRow",
								children: [
									react_jsx_runtime.jsx("input", {
										id: `cursor-subscription-${key}`,
										type: "checkbox",
										checked: form?.[key] === "true",
										disabled: busy || form === undefined,
										onChange: change(key),
									}),
									react_jsx_runtime.jsx("label", { htmlFor: `cursor-subscription-${key}`, children: t(label) }),
								],
							}),
							react_jsx_runtime.jsx("span", { className: "cursorSubscriptionFieldHint", children: t(hint) }),
						],
					});
				}
				return react_jsx_runtime.jsxs("div", {
					className,
					children: [
						react_jsx_runtime.jsx("label", { htmlFor: `cursor-subscription-${key}`, children: t(label) }),
						react_jsx_runtime.jsx("input", {
							id: `cursor-subscription-${key}`,
							type: properties.type ?? "number",
							min: properties.min,
							max: properties.max,
							step: "1",
							disabled: busy || form === undefined,
							value: form?.[key] ?? "",
							onChange: change(key),
						}),
						react_jsx_runtime.jsx("span", { className: "cursorSubscriptionFieldHint", children: t(hint) }),
					],
				});
			};
			return react_jsx_runtime.jsxs("div", {
				className: "cursorSubscriptionCard",
				children: [
					react_jsx_runtime.jsxs("div", {
						className: "cursorSubscriptionSectionTitle",
						children: [
							react_jsx_runtime.jsx("h3", { children: t("runtimeSettings") }),
							react_jsx_runtime.jsx("p", { className: "cursorSubscriptionFreshness", children: t("runtimeSettingsNote") }),
						],
					}),
					react_jsx_runtime.jsxs("div", {
						className: "cursorSubscriptionSettingsGrid",
						children: [
							field("maxToolRounds", "maxToolRounds", "maxToolRoundsHint", { min: 1, max: 1000 }),
							field("retryCount", "retryCount", "retryCountHint", { min: 0, max: 10 }),
							field("retryIntervalMs", "retryInterval", "retryIntervalHint", { min: 0, max: 300000 }),
							field("retryHttpStatusCodes", "retryStatuses", "retryStatusesHint", { type: "text", wide: true }),
							field("replayHistoryEachStep", "replayHistoryEachStep", "replayHistoryEachStepHint", { type: "checkbox", wide: true }),
						],
					}),
					error === undefined ? null : react_jsx_runtime.jsx("p", { className: "cursorSubscriptionError", role: "alert", children: error }),
					react_jsx_runtime.jsxs("div", {
						className: "cursorSubscriptionSettingsFoot",
						children: [
							saved ? react_jsx_runtime.jsx("p", { className: "cursorSubscriptionSuccess", role: "status", children: t("settingsSaved") }) : react_jsx_runtime.jsx("span", {}),
							react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.Button, {
								type: "button",
								variant: "primary",
								disabled: busy || (form !== undefined && baseline === undefined),
								onClick: form === undefined ? load : save,
								children: busy
									? form === undefined ? t("loadingSettings") : t("savingSettings")
									: form === undefined ? t("reloadSettings") : t("saveSettings"),
							}),
						],
					}),
				],
			});
		}

		function CursorSection({ rpc, t }) {
			const [account, setAccount] = react.useState();
			const [error, setError] = react.useState();
			const [resetKey, setResetKey] = react.useState(0);
			const [version, setVersion] = react.useState();
			react.useEffect(() => {
				let live = true;
				readVersion(rpc).then((label) => {
					if (live) setVersion(label);
				});
				return () => {
					live = false;
				};
			}, []);
			react.useEffect(() => {
				let live = true;
				rpc.call(CHANNEL, "status", {})
					.then(unwrap)
					.then((next) => {
						if (live) setAccount(next);
					})
					.catch(() => {
						if (live) setError(t("loadFailed"));
					});
				return () => {
					live = false;
				};
			}, [resetKey]);
			const signedIn = account?.authenticated === true;
			return react_jsx_runtime.jsxs("section", {
				className: "cursorSubscription",
				children: [
					react_jsx_runtime.jsx("div", {
						className: "cursorSubscriptionHead",
						children: [
							react_jsx_runtime.jsx("h2", { children: t("title") }),
							version === undefined
								? null
								: react_jsx_runtime.jsx("span", {
										className: "cursorSubscriptionVersion",
										title: `dsh-cursor-subscription ${version}`,
										children: version,
									}),
						],
					}),
					error === undefined
						? null
						: react_jsx_runtime.jsx("p", { className: "cursorSubscriptionError", role: "alert", children: error }),
					react_jsx_runtime.jsx(AccountCard, {
						rpc,
						t,
						account,
						setAccount,
						onSignedOut: () => setResetKey((value) => value + 1),
					}),
					react_jsx_runtime.jsx(UsageCard, { rpc, t, signedIn, resetKey }),
					react_jsx_runtime.jsx(ModelsCard, { rpc, t, signedIn }),
					react_jsx_runtime.jsx(RuntimeSettingsCard, { rpc, t }),
					react_jsx_runtime.jsx("p", { className: "cursorSubscriptionNote", children: t("note") }),
				],
			});
		}

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, DICTIONARIES), "cursor-subscription: copy");
			// Contribute the panel's extra languages to the shared catalog. A locale
			// id may already be owned by DSH itself or by another language pack: that
			// is not an error, the dictionary above simply joins the existing one. An
			// older locale runtime without language packs has no `addLanguage`, which
			// leaves the built-in zh/en panel in place instead of failing the client.
			ctx.effect(() => {
				const disposers = [];
				for (const language of LANGUAGES) {
					const taken = ctx.locale.getLocale().locales.some((entry) => entry.id === language.id);
					if (taken) continue;
					try {
						disposers.push(ctx.locale.addLanguage(language));
					} catch {
						/* an occupied id or an unavailable fallback leaves the panel working */
					}
				}
				return () => {
					for (const dispose of disposers) dispose();
				};
			}, "cursor-subscription: languages");
			// Mirror the panel while a right-to-left language is active. The marker
			// rides the document element so the stylesheet can scope it; nothing else
			// in the shell is affected.
			ctx.effect(() => {
				const root = document.documentElement;
				const sync = () => {
					if (RTL_LOCALES.has(ctx.locale.getLocale().active)) root.dataset[RTL_ATTRIBUTE] = "";
					else delete root.dataset[RTL_ATTRIBUTE];
				};
				sync();
				const off = ctx.locale.subscribe(sync);
				return () => {
					off();
					delete root.dataset[RTL_ATTRIBUTE];
				};
			}, "cursor-subscription: direction");
			ctx.effect(() => {
				const tag = document.createElement("style");
				tag.dataset.plugin = "dsh-cursor-subscription";
				tag.textContent = STYLE;
				document.head.append(tag);
				return () => tag.remove();
			}, "cursor-subscription: style");
			const connection = ctx.get("connection");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () =>
				ctx.slots.register(
					{
						name: "settings.section",
						id: "cursor-suite",
						order: 20,
						label: () => t("nav"),
						locale: NS,
						inject: () => ({ rpc: connection.rpc, t }),
					},
					CursorSection,
				),
			);
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		// Pure helpers the panel's tests pin; the DSH client module loader reads only apply/inject.
		exports.formatVersion = formatVersion;
		exports.readVersion = readVersion;
		exports.includedUsageRows = includedUsageRows;
		exports.percent1 = percent1;
		exports.compactTokens = compactTokens;
		return module.exports;
	},
});


  // ===== vision（读图）原始 bundle =====
/**
 * dsh-read-image-bridge — 设置 → 图片识读（浏览器侧）。
 *
 * `package.json` 的 `dsh.client.platform: "web"` 让 shell 把本文件当成客户端模块
 * 加载并调用 `apply(ctx)`。面板本身是 `settings.section` 里的一项：两个下拉框
 * （服务商、模型），数据来自宿主的 `GET /dsh-read-image-bridge/settings` ——
 * 那个路由会列出所有已注册路由及其声明的模型（见 lib/settings-server.js）。
 *
 * 这里刻意不用 RPC 通道而走同源 `fetch`：宿主侧把路由挂在共享 webServer 上，
 * 于是不需要额外的连接插桩，任何有 GUI 的部署都能用；没有 webServer 的部署
 * 只是没有这一页，`read_image` 本体照常工作。
 */
window.__ModuleLoader__.load({
  id: "dsh-read-image-bridge",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");
    var h = React.createElement;

    /** 宿主注册的路由；`SETTINGS_ROUTE` in lib/settings-server.js 与之相同。 */
    var API_PATH = "/dsh-read-image-bridge/settings";
    /** 设置项 id：shell 用它给导航栏那一项取键。 */
    var SECTION_ID = "read-image-bridge";
    /** 排在「内置插件」(15)、「Cursor 订阅」(20) 之后。 */
    var SECTION_ORDER = 30;
    var STYLE_ID = "dsh-read-image-bridge-style";

    var CSS = [
      '[data-dsh-rib]{color:var(--dsw-alias-label-primary,#1f2329);font-size:13px;line-height:20px;max-width:760px}',
      '[data-dsh-rib] *{box-sizing:border-box}',
      '[data-dsh-rib] .rib-head{margin:0 0 4px;font-size:18px;font-weight:600;line-height:26px}',
      '[data-dsh-rib] .rib-intro{margin:0 0 16px;color:var(--dsw-alias-label-tertiary,#8a919e);font-size:13px;line-height:20px}',
      '[data-dsh-rib] .rib-card{margin:0 0 12px;padding:16px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:10px}',
      '[data-dsh-rib] .rib-card-title{margin:0 0 4px;font-size:14px;font-weight:600;line-height:22px}',
      '[data-dsh-rib] .rib-card-note{margin:0 0 14px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#8a919e)}',
      '[data-dsh-rib] .rib-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px}',
      '[data-dsh-rib] .rib-field{display:flex;flex-direction:column;gap:6px;min-width:0}',
      '[data-dsh-rib] .rib-label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#5c6370)}',
      '[data-dsh-rib] .rib-input{width:100%;height:34px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font:inherit;outline:none}',
      '[data-dsh-rib] .rib-input:focus{border-color:var(--dsw-alias-brand-primary,#4f7cff);box-shadow:0 0 0 3px rgba(79,124,255,.14)}',
      '[data-dsh-rib] .rib-input:disabled{opacity:.6;cursor:default}',
      '[data-dsh-rib] .rib-hint{margin:8px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#8a919e)}',
      '[data-dsh-rib] .rib-warn{margin:8px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-state-warn-primary,#d89614)}',
      '[data-dsh-rib] .rib-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px}',
      '[data-dsh-rib] .rib-btn{display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 14px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}',
      '[data-dsh-rib] .rib-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04))}',
      '[data-dsh-rib] .rib-btn:disabled{opacity:.5;cursor:default}',
      '[data-dsh-rib] .rib-btn-primary{border-color:transparent;background:var(--dsw-alias-button-primary-fill,#4f7cff);color:var(--dsw-alias-label-primary-foreground,#fff)}',
      '[data-dsh-rib] .rib-btn-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,#3f6be0)}',
      '[data-dsh-rib] .rib-status{margin-top:10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#8a919e);min-height:18px;overflow-wrap:anywhere}',
      '[data-dsh-rib] .rib-status.is-error{color:var(--dsw-alias-state-error-primary,#e5484d)}',
      '[data-dsh-rib] .rib-list{margin:0;padding-left:18px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#8a919e)}',
      '[data-dsh-rib] .rib-kv{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#8a919e);overflow-wrap:anywhere}',
      '[data-dsh-rib] .rib-loading{padding:12px 0;font-size:12px;color:var(--dsw-alias-label-tertiary,#8a919e)}',
      '@media(max-width:720px){[data-dsh-rib] .rib-grid{grid-template-columns:1fr}}',
    ].join("");

    function installStyle() {
      try {
        if (typeof document === "undefined") return;
        if (document.getElementById(STYLE_ID) !== null) return;
        var tag = document.createElement("style");
        tag.id = STYLE_ID;
        tag.textContent = CSS;
        document.head.appendChild(tag);
      } catch (error) {
        /* 少一份样式只损失观感 */
      }
    }

    /**
     * 同源路由。宿主不用路径路由（`location.pathname` 恒为 `/`），所以以
     * `document.baseURI` —— 它服务于 UI 的那个目录 —— 为锚点拼出来。
     */
    function apiUrl() {
      var relative = String(API_PATH).replace(/^\/+/, "");
      try {
        if (typeof document === "undefined") return "/" + relative;
        return new URL(relative, document.baseURI).pathname;
      } catch (error) {
        return "/" + relative;
      }
    }

    function message(error) {
      if (error && error.message) return String(error.message);
      return String(error);
    }

    /** 一次 JSON 调用；失败时把服务端给的错误原样抛出来。 */
    function call(method, body) {
      var init = {
        method: method,
        cache: "no-store",
        credentials: "same-origin",
        headers: body === undefined
          ? { accept: "application/json" }
          : { accept: "application/json", "content-type": "application/json" },
      };
      if (body !== undefined) init.body = JSON.stringify(body);
      return fetch(apiUrl(), init).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok) throw new Error(data && data.error ? String(data.error) : "HTTP " + response.status);
          return data || {};
        });
      });
    }

    /** 表单初值：已保存的优先，其次当前生效（配置或默认值）。 */
    function formOf(snapshot) {
      var saved = (snapshot && snapshot.saved) || {};
      var effective = (snapshot && snapshot.effective) || {};
      var defaults = (snapshot && snapshot.defaults) || {};
      return {
        provider: saved.visionProvider || effective.provider || defaults.provider || "",
        model: saved.visionModel || effective.model || defaults.model || "",
      };
    }

    function providersOf(snapshot) {
      var list = snapshot && snapshot.providers;
      return Array.isArray(list) ? list : [];
    }

    function modelsOf(snapshot, provider) {
      var found = providersOf(snapshot).filter(function (entry) {
        return entry && entry.id === provider;
      })[0];
      return found && Array.isArray(found.models) ? found.models : [];
    }

    /** 来源的人话说明。 */
    function sourceLabel(source) {
      if (source === "settings") return "设置页（已保存）";
      if (source === "config") return "插件配置";
      if (source === "default") return "插件默认值";
      return "未知";
    }

    function optionRow(key, value, text, disabled) {
      return h("option", { key: key, value: value, disabled: disabled === true }, text);
    }

    function providerOptions(providers, current) {
      var rows = providers.map(function (entry) {
        var count = Array.isArray(entry.models) ? entry.models.length : 0;
        var suffix = count === 0 ? " · 无模型" : " · " + count + " 个模型";
        var name = entry.name && entry.name !== entry.id ? entry.name + " (" + entry.id + ")" : entry.id;
        return optionRow(entry.id, entry.id, name + suffix);
      });
      var known = providers.some(function (entry) { return entry.id === current; });
      if (current !== "" && !known) {
        rows.unshift(optionRow("__current", current, current + "（未在服务商目录中）"));
      }
      if (rows.length === 0) rows.push(optionRow("__none", "", "（没有可用的服务商）", true));
      return rows;
    }

    function modelOptions(models, current) {
      var rows = models.map(function (model) {
        var suffix = model.imageCapable === true ? " · 支持图片" : model.imageCapable === false ? " · 无图片输入" : "";
        var text = model.name && model.name !== model.id ? model.name + " (" + model.id + ")" : model.id;
        return optionRow(model.id, model.id, text + suffix);
      });
      var known = models.some(function (model) { return model.id === current; });
      if (current !== "" && !known) {
        rows.unshift(optionRow("__current", current, current + "（不在模型列表中）"));
      }
      if (rows.length === 0) rows.push(optionRow("__none", "", "（这个服务商没有列出模型）", true));
      return rows;
    }

    var INITIAL_VIEW = {
      phase: "loading",
      snapshot: null,
      form: { provider: "", model: "" },
      error: "",
      notice: "",
      busy: false,
    };

    function SettingsPanel() {
      var state = React.useState(INITIAL_VIEW);
      var view = state[0];
      var setView = state[1];
      var alive = React.useRef(true);

      React.useEffect(function () {
        alive.current = true;
        return function () { alive.current = false; };
      }, []);

      var update = React.useCallback(function (next) {
        setView(function (previous) { return Object.assign({}, previous, next); });
      }, []);

      var applySnapshot = React.useCallback(function (snapshot, extra) {
        if (!alive.current) return;
        setView(function (previous) {
          return Object.assign({}, previous, {
            phase: "ready",
            snapshot: snapshot,
            form: formOf(snapshot),
            busy: false,
            error: "",
          }, extra || {});
        });
      }, []);

      var load = React.useCallback(function () {
        update({ phase: "loading", error: "", notice: "" });
        call("GET").then(function (snapshot) {
          applySnapshot(snapshot);
        }).catch(function (error) {
          if (!alive.current) return;
          update({ phase: "error", busy: false, error: "无法读取设置：" + message(error) });
        });
      }, [applySnapshot, update]);

      React.useEffect(function () { load(); }, [load]);

      var send = React.useCallback(function (body, label) {
        update({ busy: true, error: "", notice: "" });
        call("POST", body).then(function (snapshot) {
          applySnapshot(snapshot, { notice: label });
        }).catch(function (error) {
          if (!alive.current) return;
          update({ busy: false, error: label + "失败：" + message(error) });
        });
      }, [applySnapshot, update]);

      var snapshot = view.snapshot;
      var providers = providersOf(snapshot);
      var saved = (snapshot && snapshot.saved) || {};
      var effective = (snapshot && snapshot.effective) || {};
      var hasSaved = Boolean(saved.visionProvider && saved.visionModel);
      var models = modelsOf(snapshot, view.form.provider);
      var selected = models.filter(function (model) { return model.id === view.form.model; })[0];
      var baseline = hasSaved
        ? { provider: saved.visionProvider, model: saved.visionModel }
        : { provider: effective.provider || "", model: effective.model || "" };
      var dirty = view.form.provider !== baseline.provider || view.form.model !== baseline.model;
      var ready = view.phase === "ready";
      var canSave = ready && !view.busy && view.form.provider !== "" && view.form.model !== "";

      function pickProvider(id) {
        var next = modelsOf(snapshot, id);
        var pick = next.filter(function (model) { return model.imageCapable === true; })[0] || next[0];
        update({ form: { provider: id, model: pick ? pick.id : "" }, notice: "" });
      }

      function pickModel(id) {
        update({ form: { provider: view.form.provider, model: id }, notice: "" });
      }

      function save() {
        send({ action: "save", provider: view.form.provider, model: view.form.model }, "已保存");
      }

      function reset() {
        send({ action: "reset" }, "已恢复默认");
      }

      var capability = null;
      if (selected !== undefined && selected.imageCapable === false) {
        capability = h("p", { className: "rib-warn" }, "这个模型没有声明图片输入能力，交给它读图很可能直接失败。");
      } else if (selected !== undefined && selected.imageCapable === null) {
        capability = h("p", { className: "rib-hint" }, "这个模型没有声明输入模态，无法确认它能不能读图。");
      }

      var problems = [];
      if (typeof saved.error === "string" && saved.error !== "") problems.push(saved.error);
      var diagnostics = snapshot && Array.isArray(snapshot.diagnostics) ? snapshot.diagnostics : [];
      for (var index = 0; index < diagnostics.length; index += 1) {
        var entry = diagnostics[index];
        if (!entry) continue;
        problems.push((entry.provider ? "「" + entry.provider + "」" : "目录") + "：" + String(entry.error || "未知错误"));
      }

      var status = view.error !== "" ? view.error : view.notice;
      var statusClass = "rib-status" + (view.error !== "" ? " is-error" : "");

      return h("div", { "data-dsh-rib": "" },
        h("h2", { className: "rib-head" }, "图片识读（read_image）"),
        h("p", { className: "rib-intro" },
          "当前模型看不到图片时，read_image 会把文件交给这里的视觉模型读成文字。保存后下一次读图立即生效，不必重启 DSH。"),

        view.phase === "loading" && snapshot === null
          ? h("p", { className: "rib-loading" }, "正在读取可用的模型目录…")
          : null,

        h("div", { className: "rib-card" },
          h("h3", { className: "rib-card-title" }, "图形委托模型"),
          h("p", { className: "rib-card-note" }, "选中一个能看图的模型；它的服务商必须已在本部署注册。"),
          h("div", { className: "rib-grid" },
            h("label", { className: "rib-field" },
              h("span", { className: "rib-label" }, "服务商"),
              h("select", {
                className: "rib-input",
                value: view.form.provider,
                disabled: !ready || view.busy,
                onChange: function (event) { pickProvider(event.target.value); },
              }, providerOptions(providers, view.form.provider)),
            ),
            h("label", { className: "rib-field" },
              h("span", { className: "rib-label" }, "模型"),
              h("select", {
                className: "rib-input",
                value: view.form.model,
                disabled: !ready || view.busy,
                onChange: function (event) { pickModel(event.target.value); },
              }, modelOptions(models, view.form.model)),
            ),
          ),
          capability,
          h("div", { className: "rib-actions" },
            h("button", {
              type: "button",
              className: "rib-btn rib-btn-primary",
              disabled: !canSave,
              onClick: save,
            }, view.busy ? "保存中…" : "保存"),
            h("button", {
              type: "button",
              className: "rib-btn",
              disabled: !ready || view.busy || !hasSaved,
              onClick: reset,
            }, "恢复默认"),
            h("button", {
              type: "button",
              className: "rib-btn",
              disabled: view.busy,
              onClick: load,
            }, "刷新"),
          ),
          h("p", { className: statusClass, role: view.error !== "" ? "alert" : "status" }, status),
        ),

        h("div", { className: "rib-card" },
          h("h3", { className: "rib-card-title" }, "当前生效"),
          h("p", { className: "rib-kv" },
            (effective.provider ? effective.provider + " / " + effective.model : "（尚未确定）")
              + " · 来源：" + sourceLabel(effective.source)
              + (hasSaved ? " · 文件：" + saved.path : " · 未保存过自定义模型")),
          problems.length > 0
            ? h("ul", { className: "rib-list" }, problems.map(function (text, at) {
                return h("li", { key: "p" + at }, text);
              }))
            : null,
          problems.length === 0 && providers.length === 0 && ready
            ? h("p", { className: "rib-hint" }, "这个部署没有列出任何模型路由，先用配置里的默认值。")
            : null,
        ),
      );
    }

    function apply(ctx) {
      installStyle();
      try {
        ctx.slots.inject("settings.section", function () {
          return ctx.slots.register({
            name: "settings.section",
            id: SECTION_ID,
            order: SECTION_ORDER,
            label: function () { return "图片识读"; },
          }, SettingsPanel);
        });
        // 浏览器控制台一行。「模块压根没加载」和「模块加载了但导航没接受这一项」
        // 从设置页看完全一样，只有这行能区分。
        try {
          console.info("[dsh-read-image-bridge] settings section registered: " + SECTION_ID);
        } catch (ignored) {
          /* console 不可用就算了 */
        }
      } catch (error) {
        // 少一页设置不影响 read_image 本体。
        try {
          console.error("[dsh-read-image-bridge] settings section registration failed:", error);
        } catch (ignored) {
          /* nothing to do */
        }
      }
    }

    exports.apply = apply;
    exports.inject = ["slots"];
    // Pure helpers a test can pin; the DSH client module loader reads only
    // `apply` and `inject`, so exporting these costs nothing at runtime.
    exports.__internals = {
      API_PATH: API_PATH,
      SECTION_ID: SECTION_ID,
      SECTION_ORDER: SECTION_ORDER,
      apiUrl: apiUrl,
      formOf: formOf,
      providerOptions: providerOptions,
      modelOptions: modelOptions,
      sourceLabel: sourceLabel,
      SettingsPanel: SettingsPanel,
    };
    return module.exports;
  },
});

  } finally {
    loader.load = realLoad;
  }

  if (captured.length === 0) return;

  /** 侧边栏项与主页面的共同 id：点击侧边栏就切到这个 key 的页面。 */
  var SUITE_ID = 'cursor-suite';
  /** 浏览器模块身份：DSH 用 manifest 包名做模块 id，必须与 package.json 的 name 一致。 */
  var MODULE_ID = 'dsh-cursor-suite';
  /** 文案命名空间沿用 Cursor 面板那一套，侧边栏标题从中取 nav。 */
  var NS = 'settings.cursorSubscription';

  realLoad({
    id: MODULE_ID,
    factory: function (require) {
      var React = require('react');
      var h = React.createElement;

      /* 每一半实例化后的导出，顺序与下面 bundle 的顺序一致。 */
      var loaded = [];
      for (var i = 0; i < captured.length; i++) {
        try {
          loaded.push(captured[i].factory(require) || {});
        } catch (error) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('[cursor-suite] client half ' + captured[i].id + ' failed to load: ' +
              (error && error.message ? error.message : error));
          }
          loaded.push({});
        }
      }

      /* 两半 inject 的并集；宿主只装一个插件，缺一项整个模块就不会被调用。 */
      var injected = [];
      for (var j = 0; j < loaded.length; j++) {
        var list = loaded[j].inject;
        if (!Array.isArray(list)) continue;
        for (var k = 0; k < list.length; k++) {
          if (injected.indexOf(list[k]) === -1) injected.push(list[k]);
        }
      }

      /* 截下来的面板：[{ options, component }]。顺序即上下顺序。 */
      var sections = [];
      /** 宿主上下文，页面渲染时用它取 connection 与 locale。 */
      var suiteCtx = null;

      /**
       * 造一个只换两处的 ctx：ctx.slots 换成门面，其 register 会把
       * settings.section 的注册收下来（只存不注册），其余原样转发。
       */
      function facadeCtx(realCtx) {
        var realSlots = realCtx.slots;
        if (!realSlots) return realCtx;

        var slotsProxy = new Proxy(realSlots, {
          get: function (target, key) {
            if (key === 'register') {
              return function (options, component) {
                if (options && options.name === 'settings.section') {
                  sections.push({ options: options, component: component });
                  return function () {};
                }
                return target.register.call(target, options, component);
              };
            }
            if (key === 'inject') {
              return function (name, callback) {
                return target.inject.call(target, name, callback);
              };
            }
            var value = target[key];
            return typeof value === 'function' ? value.bind(target) : value;
          },
        });

        return new Proxy(realCtx, {
          get: function (target, key) {
            if (key === 'slots') return slotsProxy;
            var value = target[key];
            return typeof value === 'function' ? value.bind(target) : value;
          },
        });
      }

      /** 面板要的 props：rpc 走 connection，t 走 Cursor 那套文案。 */
      function panelProps() {
        var props = { rpc: undefined, t: function (key) { return key; } };
        var ctx = suiteCtx;
        if (!ctx) return props;
        try {
          var connection = ctx.get ? ctx.get('connection') : undefined;
          if (connection && connection.rpc) props.rpc = connection.rpc;
        } catch (ignored) {
          /* 没有 connection 时面板自己会报未登录，不影响页面渲染 */
        }
        try {
          props.t = ctx.locale.bind(NS);
        } catch (ignored) {
          /* 没有 locale 时退回 key 本身，至少不崩 */
        }
        return props;
      }

      /** 侧边栏图标：一条光标箭头，和 Aurabot 的鲸鱼图标同尺寸同风格。 */
      function SuiteIcon(props) {
        var s = (props && props.size) || 16;
        return h(
          'svg',
          {
            width: s,
            height: s,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.6,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            'aria-hidden': true,
          },
          h('path', { d: 'M5 3.5 19 12l-6.4 1.6L9.6 20 5 3.5Z' }),
          h('path', { d: 'M13.2 14.2 17.4 19' }),
        );
      }

      /** 订阅额度走 Cursor 面板同一条 usage RPC。 */
      var USAGE_CHANNEL = '/cursor-subscription';

      /** 一位小数的百分比；不是数字就画破折号。 */
      function percent1(value) {
        return typeof value === 'number' && isFinite(value) ? value.toFixed(1) + '%' : '—';
      }

      /** 一根进度条：75% 起转黄，95% 转红（到 95% 会自动切 Composer Fast）。 */
      function QuotaRow(props) {
        var value = typeof props.value === 'number' && isFinite(props.value) ? props.value : undefined;
        var clamped = value === undefined ? 0 : Math.max(0, Math.min(100, value));
        var color = clamped >= 95 ? '#e5484d' : clamped >= 75 ? '#f5a623' : '#3964fe';
        return h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 } },
          h('span', { style: { width: 120, flex: 'none', color: 'var(--dsw-alias-label-secondary,#5c6370)' } }, props.label),
          h(
            'div',
            {
              style: {
                flex: 1,
                height: 6,
                borderRadius: 999,
                background: 'var(--dsw-alias-border-l3, rgba(0,0,0,.1))',
                overflow: 'hidden',
              },
            },
            h('div', { style: { width: clamped + '%', height: '100%', borderRadius: 999, background: color } }),
          ),
          h(
            'span',
            { style: { width: 54, flex: 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums' } },
            percent1(value),
          ),
        );
      }

      /** 额度卡：命名池 / Auto 池 / 合计，加账期剩余天数。读不到只报警，不挡页面。 */
      function QuotaCard() {
        var pair = React.useState({ loading: true, usage: null, error: '' });
        var view = pair[0];
        var setView = pair[1];

        var load = React.useCallback(function (force) {
          var rpc;
          try {
            var ctx = suiteCtx;
            var connection = ctx && ctx.get ? ctx.get('connection') : undefined;
            rpc = connection && connection.rpc ? connection.rpc : undefined;
          } catch (ignored) {
            rpc = undefined;
          }
          if (!rpc) {
            setView({ loading: false, usage: null, error: '宿主通道还没连上' });
            return;
          }
          setView(function (prev) {
            return { loading: true, usage: prev.usage, error: '' };
          });
          rpc
            .call(USAGE_CHANNEL, 'usage', { force: force === true })
            .then(function (res) {
              if (!res || res.ok !== true) {
                throw new Error((res && res.error && res.error.message) || '读取额度失败');
              }
              setView({ loading: false, usage: res.value || null, error: '' });
            })
            .catch(function (err) {
              setView({ loading: false, usage: null, error: err && err.message ? err.message : String(err) });
            });
        }, []);

        React.useEffect(function () {
          load(false);
        }, [load]);

        var usage = view.usage;
        var plan = (usage && usage.plan) || {};
        var cycle = usage && usage.billingCycle;
        var ir = usage && usage.includedRequests;
        var rows = [];

        if (usage) {
          rows.push(h(QuotaRow, { key: 'named', label: '命名模型池', value: plan.apiPercentUsed }));
          rows.push(h(QuotaRow, { key: 'auto', label: 'Auto 池', value: plan.autoPercentUsed }));
          if (typeof plan.totalPercentUsed === 'number') {
            rows.push(h(QuotaRow, { key: 'total', label: '合计', value: plan.totalPercentUsed }));
          }
        }

        var facts = [];
        if (cycle && typeof cycle.daysLeft === 'number') facts.push('账期还剩 ' + cycle.daysLeft + ' 天');
        if (usage && typeof usage.membershipType === 'string' && usage.membershipType) {
          facts.push(usage.membershipType.toUpperCase());
        }
        if (ir) {
          var used = typeof ir.used === 'number' ? ir.used : typeof ir.numRequests === 'number' ? ir.numRequests : undefined;
          var limit = typeof ir.limit === 'number' ? ir.limit : typeof ir.maxRequestUsage === 'number' ? ir.maxRequestUsage : undefined;
          if (used !== undefined && limit !== undefined) facts.push('包含请求 ' + used + ' / ' + limit);
        }

        return h(
          'div',
          {
            style: {
              border: '1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.1))',
              borderRadius: 12,
              padding: '14px 16px',
              maxWidth: 720,
            },
          },
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            h('h3', { style: { margin: 0, fontSize: 15, fontWeight: 600 } }, '订阅额度'),
            h('span', { style: { flex: 1 } }),
            h(
              'button',
              {
                type: 'button',
                disabled: view.loading,
                onClick: function () {
                  load(true);
                },
                style: {
                  height: 28,
                  padding: '0 12px',
                  border: '1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.14))',
                  borderRadius: 8,
                  background: 'transparent',
                  color: 'inherit',
                  cursor: view.loading ? 'default' : 'pointer',
                  opacity: view.loading ? 0.5 : 1,
                },
              },
              view.loading ? '读取中…' : '刷新',
            ),
          ),
          view.error !== ''
            ? h(
                'p',
                { style: { margin: '10px 0 0', fontSize: 12, color: 'var(--dsw-alias-state-warn-primary,#d89614)' } },
                view.error,
              )
            : null,
          !usage && view.error === ''
            ? h(
                'p',
                { style: { margin: '10px 0 0', fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8a919e)' } },
                '正在读取…',
              )
            : null,
          rows.length > 0 ? h('div', { style: { marginTop: 6 } }, rows) : null,
          facts.length > 0
            ? h(
                'p',
                { style: { margin: '12px 0 0', fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8a919e)' } },
                facts.join(' · '),
              )
            : null,
          rows.length > 0
            ? h(
                'p',
                { style: { margin: '8px 0 0', fontSize: 12, color: 'var(--dsw-alias-label-tertiary,#8a919e)' } },
                '命名模型池到 95% 会自动切到 Composer Fast，账期重置后自己切回来。',
              )
            : null,
        );
      }

      /** 额度卡 + 两个面板，自上而下，每段之间一道分隔线。 */
      function CombinedPage() {
        var props = panelProps();
        var children = [h(QuotaCard, { key: 'quota' })];
        for (var n = 0; n < sections.length; n++) {
          var section = sections[n];
          if (typeof section.component !== 'function') continue;
          children.push(
            h(
              'div',
              {
                key: 'sec-' + n,
                style: n === 0
                  ? undefined
                  : {
                      marginTop: 32,
                      paddingTop: 24,
                      borderTop: '1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.08))',
                    },
              },
              h(section.component, props),
            ),
          );
        }
        if (children.length === 0) return null;
        return h(
          'div',
          {
            style: {
              height: '100%',
              overflow: 'auto',
              boxSizing: 'border-box',
              padding: '24px 28px 48px',
              maxWidth: 800,
            },
          },
          children,
        );
      }

      function apply(realCtx) {
        suiteCtx = realCtx;
        var ctx = facadeCtx(realCtx);

        for (var n = 0; n < loaded.length; n++) {
          if (typeof loaded[n].apply !== 'function') continue;
          try {
            loaded[n].apply(ctx);
          } catch (error) {
            if (typeof console !== 'undefined' && console.warn) {
              console.warn('[cursor-suite] client half failed to apply: ' +
                (error && error.message ? error.message : error));
            }
          }
        }

        var slots;
        try {
          slots = realCtx.slots || (realCtx.get ? realCtx.get('slots') : undefined);
        } catch (ignored) {
          slots = undefined;
        }
        if (!slots) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('[cursor-suite] no slots service; page not mounted');
          }
          return;
        }

        try {
          slots.inject('main', function () {
            return slots.register({ name: 'main', key: SUITE_ID }, CombinedPage);
          });
          slots.inject('sidebar.panellist', function () {
            return slots.register(
              {
                name: 'sidebar.panellist',
                id: SUITE_ID,
                order: 25,
                label: function () {
                  try {
                    return suiteCtx.locale.bind(NS)('nav');
                  } catch (ignored) {
                    return 'Cursor';
                  }
                },
              },
              SuiteIcon,
            );
          });
          try {
            console.info('[dsh-cursor-suite] sidebar page registered: ' + SUITE_ID);
          } catch (ignored) {
            /* console 不可用就算了 */
          }
        } catch (error) {
          if (typeof console !== 'undefined' && console.error) {
            console.error('[dsh-cursor-suite] sidebar page registration failed:', error);
          }
        }
      }

      return { apply: apply, inject: injected };
    },
  });
})();
