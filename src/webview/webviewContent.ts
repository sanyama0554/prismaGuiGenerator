export function getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prisma Schema Viewer</title>
      ${getExternalResources()}
      ${getStyles()}
    </head>
    <body>
      ${getMainContent()}
      ${getScripts()}
    </body>
    </html>
  `;
}

function getExternalResources(): string {
  return `
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"></script>
  `;
}

function getStyles(): string {
  return `
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #1e1e2e;
        color: #c9d1d9;
        padding: 20px;
      }
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
      pre {
        background-color: #2d2d3a;
        padding: 10px;
        border-radius: 5px;
        color: #c9d1d9;
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
  `;
}

function getMainContent(): string {
  return `
    <h2>Prisma Schema Viewer</h2>
    <div id="tablesContainer"></div>
    <div class="mermaid" id="mermaidChart"></div>
    <button onclick="submitSelection()">Generate Prisma Queries</button>
    <pre id="generatedCode"></pre>
  `;
}

function getScripts(): string {
  return `
    <script>
      let schemaData = [];

      window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'loadSchema') {
          schemaData = message.data;
          renderTables(schemaData.models);
          setTimeout(() => renderERDiagram(schemaData.models), 500);
        }
      });

      function renderTables(models) {
        const container = document.getElementById('tablesContainer');
        if (!container) return;
        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.gap = '20px';
        container.style.justifyContent = 'center';

        models.forEach(model => {
          const table = document.createElement('div');
          table.className = 'table-card';

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
            fieldCheckbox.setAttribute('data-field-name', field.name);

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
        let diagram = 'erDiagram\\n';

        models.forEach(model => {
          diagram += \`  \${model.name} {\\n\`;
          model.fields.forEach(field => {
            diagram += \`    \${field.type} \${field.name}\\n\`;
          });
          diagram += \`  }\\n\`;
        });

        models.forEach(model => {
          model.fields.forEach(field => {
            if (field.relation && field.relation.target) {
              diagram += \`  \${model.name} ||--o{ \${field.relation.target} : "\${field.name}"\\n\`;
            }
          });
        });

        // 正しいER図をmermaidに渡す
        const mermaidChart = document.getElementById('mermaidChart');
        if (!mermaidChart) return;
        mermaidChart.innerHTML = '';  // 余計な文字列を削除
        mermaid.initialize({ startOnLoad: true, theme: "dark" });
        mermaid.render('generatedDiagram', diagram, svgCode => {
          mermaidChart.innerHTML = svgCode;
        });
      }

      function submitSelection() {
        const selectedTables = [];
        document.querySelectorAll('.table-card').forEach(table => {
          const tableName = table.querySelector('.table-header span').textContent.trim();
          const selectedFields = [];

          table.querySelectorAll('.field input[type="checkbox"]:checked').forEach(checkbox => {
            const fieldName = checkbox.getAttribute('data-field-name');
            if (fieldName) selectedFields.push(fieldName);
          });

          if (selectedFields.length > 0) {
            selectedTables.push({ tableName, fields: selectedFields });
          }
        });

        displayGeneratedCode(selectedTables);
      }

      function displayGeneratedCode(selectedTables) {
        let code = '';

        selectedTables.forEach(table => {
          code += \`const res = await prisma.\${table.tableName.toLowerCase()}.findMany({\\n  select: {\\n\`;
          table.fields.forEach(field => {
            code += \`    \${field}: true,\\n\`;
          });
          code += '  }\\n});\\n\\n';
        });

        document.getElementById('generatedCode').innerText = code;
      }
    </script>
  `;
}
