export function getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prisma Schema Viewer</title>
      <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"></script>
      <script>
        let schemaData = [];

        window.addEventListener('message', event => {
          console.log("Received message:", event.data);
          const message = event.data;
          if (message.command === 'loadSchema') {
            console.log("Schema data received:", message.data);
            schemaData = message.data;
            renderTables(schemaData.models);
            setTimeout(() => renderERDiagram(schemaData.models), 500);
          }
        });

        function renderTables(models) {
          const container = document.getElementById('tablesContainer');
          console.log("Container found:", container);
          if (!container) return;
          container.innerHTML = '';
          container.style.display = 'flex';
          container.style.flexWrap = 'wrap';
          container.style.gap = '20px';
          container.style.justifyContent = 'center';

          console.log("Rendering tables with data:", models);
          models.forEach(model => {
            const table = document.createElement('div');
            table.className = 'table-card';
            table.setAttribute('data-x', '0');
            table.setAttribute('data-y', '0');

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

          interact('.table-card').draggable({
            inertia: true,
            modifiers: [
              interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
              })
            ],
            autoScroll: true,
            listeners: {
              move(event) {
                const target = event.target;
                let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                target.style.transform = \`translate(\${x}px, \${y}px)\`;
                target.setAttribute('data-x', x.toString());
                target.setAttribute('data-y', y.toString());
              }
            }
          });
        }

        function renderERDiagram(models) {
          let diagram = 'erDiagram\\\\n';

          models.forEach(model => {
            diagram += \`  \${model.name} {\\\\n\`;
            model.fields.forEach(field => {
              diagram += \`    \${field.type} \${field.name}\\\\n\`;
            });
            diagram += \`  }\\\\n\`;
          });

          models.forEach(model => {
            model.fields.forEach(field => {
              if (field.relation && field.relation.target) {
                diagram += \`  \${model.name} ||--o{ \${field.relation.target} : "\${field.name}"\\\\n\`;
              }
            });
          });

          const mermaidChart = document.getElementById('mermaidChart');
          if (!mermaidChart) return;
          mermaidChart.innerText = diagram;
          mermaid.initialize({ startOnLoad: true, theme: "dark" });
          mermaid.init(undefined, mermaidChart);
        }

        function submitSelection() {
          const selectedTables = [];
          document.querySelectorAll('.table-card').forEach(table => {
            const titleSpan = table.querySelector('.table-header span');
            if (!titleSpan || !titleSpan.textContent) return;
            const tableName = titleSpan.textContent;
            const selectedFields = [];

            table.querySelectorAll('.field input[type="checkbox"]:checked').forEach(checkbox => {
              const parent = checkbox.parentElement;
              if (!parent || !parent.textContent) return;
              selectedFields.push(parent.textContent.trim());
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
          width: 300px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
          text-align: left;
          position: relative;
          cursor: grab;
        }
        .table-card:active {
          cursor: grabbing;
        }
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
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
        .mermaid {
          text-align: left;
          white-space: pre-wrap;
          margin-top: 20px;
          background: #2d2d3a;
          padding: 10px;
          border-radius: 8px;
          color: #fff;
          max-width: 90%;
          overflow-x: auto;
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
