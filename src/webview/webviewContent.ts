export function getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prisma Schema Viewer</title>
      <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      <script>
        let schemaData = [];

        window.addEventListener('message', event => {
          const message = event.data;
          if (message.command === 'loadSchema') {
            schemaData = message.data;
            renderTables(schemaData.models);
            renderERDiagram(schemaData.models);
          }
        });

        function renderTables(models) {
          const container = document.getElementById('tablesContainer');
          container.innerHTML = '';
          models.forEach((model, index) => {
            const table = document.createElement('div');
            table.className = 'table-card';
            table.style.left = (index * 350) + 'px';
            table.style.top = (index * 50) + 'px';

            const header = document.createElement('div');
            header.className = 'table-header';
            const tableTitle = document.createElement('span');
            tableTitle.textContent = model.name;

            const selectAllCheckbox = document.createElement('input');
            selectAllCheckbox.type = 'checkbox';
            selectAllCheckbox.onclick = () => {
              const checkboxes = table.querySelectorAll('.field input[type="checkbox"]');
              checkboxes.forEach(checkbox => checkbox.checked = selectAllCheckbox.checked);
            };

            header.appendChild(tableTitle);
            header.appendChild(selectAllCheckbox);
            table.appendChild(header);

            model.fields.forEach(field => {
              const fieldDiv = document.createElement('div');
              fieldDiv.className = 'field';

              const fieldName = document.createElement('span');
              fieldName.textContent = \`\${field.name} (\${field.type})\`;

              const fieldCheckbox = document.createElement('input');
              fieldCheckbox.type = 'checkbox';

              fieldDiv.appendChild(fieldName);
              fieldDiv.appendChild(fieldCheckbox);
              table.appendChild(fieldDiv);
            });

            container.appendChild(table);
          });
        }

        function renderERDiagram(models) {
          let diagram = 'erDiagram\\n';

          models.forEach(model => {
            diagram += \`  \${model.name} {\\n\`;
            model.fields.forEach(field => {
              diagram += \`    \${field.type} \${field.name}\\n\`;
            });
            diagram += \`  }\\n\`;
          });

          // リレーションの追加
          models.forEach(model => {
            model.fields.forEach(field => {
              if (field.relation) {
                diagram += \`  \${model.name} }|--|| \${field.relation.target} : "\${field.name}"\\n\`;
              }
            });
          });

          document.getElementById('mermaidChart').innerHTML = diagram;
          mermaid.init(undefined, document.getElementById('mermaidChart'));
        }

        function submitSelection() {
          const selectedTables = [];
          document.querySelectorAll('.table-card').forEach(table => {
            const tableName = table.querySelector('.table-header span').textContent;
            const selectedFields = [];
            table.querySelectorAll('.field input[type="checkbox"]:checked').forEach(checkbox => {
              selectedFields.push(checkbox.parentElement.textContent.trim());
            });

            if (selectedFields.length > 0) {
              selectedTables.push({ tableName, fields: selectedFields });
            }
          });

          const vscode = acquireVsCodeApi();
          vscode.postMessage({
            command: 'submitSelection',
            data: selectedTables
          });
        }
      </script>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          background-color: #1e1e2e; 
          color: #c9d1d9; 
          padding: 20px;
        }
        h2 { color: #fff; }
        .table-card {
          background: #2d2d3a;
          border-radius: 8px;
          padding: 15px;
          margin: 15px;
          width: 300px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
          position: absolute;
        }
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .table-header input {
          transform: scale(1.3);
          cursor: pointer;
        }
        .field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #444;
        }
        .field:last-child {
          border-bottom: none;
        }
        input[type="checkbox"] {
          transform: scale(1.2);
          cursor: pointer;
        }
        .mermaid {
          text-align: center;
          margin-top: 20px;
        }
        button {
          padding: 10px 20px;
          margin-top: 20px;
          background: #008cba;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <h2>Prisma Schema Viewer</h2>
      <div id="tablesContainer"></div>
      <div class="mermaid" id="mermaidChart"></div>
      <button onclick="submitSelection()">Submit Selection</button>
    </body>
    </html>
  `;
}
