// utils/excelExporter.js

export const exportToExcel = (data, filename = 'cost_estimation.xlsx') => {
    const escapeXML = (str) =>
        String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');

    const createXMLSheet = (sheetData) => {
        let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
        xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
        xml += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
        xml += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
        xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
        xml += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

        xml += '<Styles>';
        xml += '<Style ss:ID="Header"><Font ss:Bold="1" ss:Size="12"/><Interior ss:Color="#F8F9FA" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>';
        xml += '<Style ss:ID="Currency"><NumberFormat ss:Format="$#,##0.00"/></Style>';
        xml += '<Style ss:ID="Total"><Font ss:Bold="1"/><Interior ss:Color="#F8F9FA" ss:Pattern="Solid"/><NumberFormat ss:Format="$#,##0.00"/></Style>';
        xml += '</Styles>';

        xml += '<Worksheet ss:Name="Cost Estimation"><Table>';
        [300, 140, 120, 120, 150].forEach(w => { xml += `<Column ss:Width="${w}"/>`; });

        sheetData.forEach((row, rowIndex) => {
            xml += '<Row>';
            row.forEach((cell, colIndex) => {
                const cellValue = cell ?? '';
                const isHeader = rowIndex === 0;
                const isTotalRow = rowIndex === sheetData.length - 1;
                const isCurrency = colIndex === 3 || colIndex === 4;

                let styleID = '';
                if (isHeader) styleID = 'Header';
                else if (isTotalRow && colIndex === 4) styleID = 'Total';
                else if (isCurrency && !isHeader) styleID = 'Currency';

                const styleAttr = styleID ? ` ss:StyleID="${styleID}"` : '';
                const dataType = typeof cellValue === 'number' ? 'Number' : 'String';
                xml += `<Cell${styleAttr}><Data ss:Type="${dataType}">${escapeXML(cellValue)}</Data></Cell>`;
            });
            xml += '</Row>';
        });

        xml += '</Table></Worksheet></Workbook>';
        return xml;
    };

    const xmlContent = createXMLSheet(data);
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};
