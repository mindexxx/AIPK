import * as XLSX from 'xlsx';
import { CustomProductDatabase } from '../types';

export const exportDatabasesToExcel = (dbs: CustomProductDatabase[]) => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    let hasSheet = false;

    // Iterate through ALL selected databases
    dbs.forEach(db => {
        // Iterate through series in this database
        db.series.forEach(series => {
            if (series.models.length === 0) return;

            // 1. Collect all unique index names to create headers dynamically
            const allIndexNames = new Set<string>();
            series.models.forEach(m => m.indexes.forEach(i => allIndexNames.add(i.name)));
            
            // Headers: Add 'Database' and 'Series' columns for clarity in merged exports
            const headers = ['Database', 'Series', 'Model Name', ...Array.from(allIndexNames)];

            // 2. Create rows mapping model data to headers
            const rows = series.models.map(model => {
                const row: any = { 
                    'Database': db.name,
                    'Series': series.name,
                    'Model Name': model.name 
                };
                model.indexes.forEach(idx => {
                    row[idx.name] = idx.value;
                });
                return row;
            });

            // 3. Create worksheet from JSON data
            const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
            
            // 4. Set column widths
            const colWidths = headers.map(h => ({ wch: Math.max(h.length + 5, 15) }));
            ws['!cols'] = colWidths;

            // 5. Generate Sheet Name
            // Base name: If multiple DBs, include DB name to avoid confusion. If single, just Series name.
            let baseName = dbs.length > 1 ? `${db.name}-${series.name}` : series.name;
            if (!baseName) baseName = 'Sheet';
            
            // Sanitize: Excel forbids : \ / ? * [ ]
            baseName = baseName.replace(/[:\/?*\[\]\\]/g, "_");
            
            // Truncate and ensure uniqueness (Excel max 31 chars)
            let sheetName = baseName.substring(0, 31);
            let counter = 1;
            
            // Check against existing sheets in the workbook
            while (wb.SheetNames.includes(sheetName)) {
                const suffix = `_${counter}`;
                // Truncate base enough to fit suffix
                sheetName = baseName.substring(0, 31 - suffix.length) + suffix;
                counter++;
            }

            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            hasSheet = true;
        });
    });

    // Handle case where DBs have no data
    if (!hasSheet) {
        const ws = XLSX.utils.json_to_sheet([{ Info: "Selected databases contain no model data." }]);
        XLSX.utils.book_append_sheet(wb, ws, "Summary");
    }

    // Write file and trigger download
    // Filename: MultiDB_Export_YYYYMMDD.xlsx or SingleDBName...
    const date = new Date().toISOString().split('T')[0];
    const namePart = dbs.length === 1 ? dbs[0].name : `InduComp_Export_${dbs.length}_DBs`;
    const filename = `${namePart.replace(/\s+/g, '_')}_${date}.xlsx`;
    
    XLSX.writeFile(wb, filename);
};
