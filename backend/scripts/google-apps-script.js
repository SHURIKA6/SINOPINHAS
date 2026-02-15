/**
 * ============================================================
 * SINOPINHAS — Google Apps Script Web App
 * ============================================================
 * 
 * INSTRUÇÕES DE INSTALAÇÃO:
 * 
 * 1. Abra a planilha Google Sheets:
 *    https://docs.google.com/spreadsheets/d/1ahJ5JxgylOYOpyfwytQndDwkj2gecsz295bBajY0tSU/edit
 * 
 * 2. Vá em Extensões > Apps Script
 * 
 * 3. Apague todo o conteúdo padrão e cole este código inteiro
 * 
 * 4. Clique em "Implantar" > "Nova implantação"
 *    - Tipo: "App da Web"  
 *    - Executar como: "Eu" (sua conta)
 *    - Acesso: "Qualquer pessoa"
 * 
 * 5. Copie a URL gerada e configure como GOOGLE_SHEETS_URL
 *    no Cloudflare Worker:
 *    npx wrangler secret put GOOGLE_SHEETS_URL
 *    (cole a URL)
 * 
 * ============================================================
 */

// Mapeamento: definição de colunas para cada aba/tabela
const SHEET_COLUMNS = {
    'audit_logs': ['timestamp', 'user_id', 'username', 'action', 'ip', 'city', 'country', 'region', 'platform', 'is_mobile', 'user_agent', 'fingerprint_raw', 'ray_id'],
    'users': ['timestamp', 'action', 'user_id', 'username', 'role', 'email', 'avatar', 'bio'],
    'videos': ['timestamp', 'action', 'video_id', 'title', 'description', 'type', 'category', 'user_id', 'username', 'url', 'is_restricted'],
    'comments': ['timestamp', 'action', 'comment_id', 'video_id', 'user_id', 'username', 'comment'],
    'likes': ['timestamp', 'action', 'video_id', 'user_id', 'username'],
    'views': ['timestamp', 'action', 'video_id', 'user_id'],
    'notifications': ['timestamp', 'action', 'notification_id', 'user_id', 'message', 'type', 'related_id'],
    'messages': ['timestamp', 'action', 'message_id', 'from_id', 'to_id', 'is_admin'],
    'support_tickets': ['timestamp', 'action', 'ticket_id', 'user_id', 'username', 'reason', 'message', 'status'],
    'reports': ['timestamp', 'action', 'report_id', 'reporter_id', 'content_type', 'content_id', 'reason', 'details', 'status'],
    'password_resets': ['timestamp', 'action', 'user_id', 'username'],
    'events': ['timestamp', 'action', 'event_id', 'title', 'description', 'date', 'time', 'location', 'category'],
    'places': ['timestamp', 'action', 'place_id', 'title', 'description', 'category', 'rating'],
    'shura_messages': ['timestamp', 'action', 'message_id', 'user_id', 'message', 'is_approved'],
    'admin_actions': ['timestamp', 'action', 'admin_id', 'target_user_id', 'details']
};

/**
 * Handler para requisições POST
 */
function doPost(e) {
    try {
        var payload = JSON.parse(e.postData.contents);

        // Suporta batch (array) ou single entry
        var entries = Array.isArray(payload) ? payload : [payload];

        var ss = SpreadsheetApp.getActiveSpreadsheet();

        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var sheetName = entry.sheet || 'audit_logs';
            var data = entry.data || entry;

            // Garantir que timestamp existe
            if (!data.timestamp) {
                data.timestamp = new Date().toISOString();
            }

            processEntry(ss, sheetName, data);
        }

        return ContentService
            .createTextOutput(JSON.stringify({ success: true, processed: entries.length }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: err.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Handler para requisições GET (teste de conectividade)
 */
function doGet(e) {
    return ContentService
        .createTextOutput(JSON.stringify({
            status: 'online',
            service: 'SINOPINHAS Sheets Sync',
            sheets: Object.keys(SHEET_COLUMNS),
            timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Processa uma entrada e adiciona na aba correta
 */
function processEntry(ss, sheetName, data) {
    var sheet = ss.getSheetByName(sheetName);

    // Criar aba se não existir
    if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        var columns = SHEET_COLUMNS[sheetName] || Object.keys(data);

        // Adicionar cabeçalho com formatação
        var headerRange = sheet.getRange(1, 1, 1, columns.length);
        headerRange.setValues([columns]);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#1a1a2e');
        headerRange.setFontColor('#ffffff');
        sheet.setFrozenRows(1);

        // Auto-resize colunas
        for (var i = 1; i <= columns.length; i++) {
            sheet.setColumnWidth(i, 150);
        }
    }

    // Buscar colunas definidas ou usar as que estão no cabeçalho existente
    var columns = SHEET_COLUMNS[sheetName];
    if (!columns) {
        var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        columns = headerRow.filter(function (h) { return h !== ''; });

        // Se a aba está vazia, usa as chaves do data
        if (columns.length === 0) {
            columns = Object.keys(data);
            sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
        }
    }

    // Verificar se há colunas novas no data que não estão no header
    var existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    var dataKeys = Object.keys(data);
    var newColumns = [];

    for (var i = 0; i < dataKeys.length; i++) {
        if (existingHeaders.indexOf(dataKeys[i]) === -1 && columns.indexOf(dataKeys[i]) === -1) {
            newColumns.push(dataKeys[i]);
        }
    }

    // Adicionar novas colunas ao header se necessário
    if (newColumns.length > 0) {
        var lastCol = existingHeaders.filter(function (h) { return h !== ''; }).length;
        for (var j = 0; j < newColumns.length; j++) {
            sheet.getRange(1, lastCol + 1 + j).setValue(newColumns[j]).setFontWeight('bold');
            columns.push(newColumns[j]);
        }
    }

    // Construir a linha de dados na ordem das colunas
    var finalHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].filter(function (h) { return h !== ''; });
    var row = [];
    for (var k = 0; k < finalHeaders.length; k++) {
        var val = data[finalHeaders[k]];
        if (typeof val === 'object' && val !== null) {
            row.push(JSON.stringify(val));
        } else {
            row.push(val !== undefined && val !== null ? val : '');
        }
    }

    // Inserir dados
    sheet.appendRow(row);

    // Limitar a 5000 linhas por aba (manter performance)
    var maxRows = 5000;
    var totalRows = sheet.getLastRow();
    if (totalRows > maxRows + 100) {
        sheet.deleteRows(2, totalRows - maxRows);
    }
}

/**
 * Função auxiliar: Criar todas as abas iniciais
 * Execute manualmente uma vez para preparar a planilha
 */
function setupAllSheets() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetNames = Object.keys(SHEET_COLUMNS);

    for (var i = 0; i < sheetNames.length; i++) {
        var name = sheetNames[i];
        var existing = ss.getSheetByName(name);

        if (!existing) {
            var sheet = ss.insertSheet(name);
            var columns = SHEET_COLUMNS[name];

            var headerRange = sheet.getRange(1, 1, 1, columns.length);
            headerRange.setValues([columns]);
            headerRange.setFontWeight('bold');
            headerRange.setBackground('#1a1a2e');
            headerRange.setFontColor('#ffffff');
            sheet.setFrozenRows(1);

            for (var j = 1; j <= columns.length; j++) {
                sheet.setColumnWidth(j, 150);
            }
        }
    }

    // Remover a "Página1" padrão se existir e estiver vazia
    var defaultSheet = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1) {
        try { ss.deleteSheet(defaultSheet); } catch (e) { }
    }

    SpreadsheetApp.getUi().alert('✅ Todas as ' + sheetNames.length + ' abas foram criadas com sucesso!');
}
