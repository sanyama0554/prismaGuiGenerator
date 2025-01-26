export function getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prisma Schema Viewer</title>
      <script>
        let schemaData = [];

        window.addEventListener('message', event => {
          const message = event.data;
          if (message.command === 'loadSchema') {
            schemaData = message.data;
            populateModels(schemaData.models);  // models配列にアクセス
          }
        });

        function populateModels(models) {
          const modelSelect = document.getElementById('modelSelect');
          modelSelect.innerHTML = '';
          models.forEach(model => {
            let option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            modelSelect.appendChild(option);
          });
          if (models.length > 0) {
            modelSelect.onchange = () => populateFields(models, modelSelect.value);
            populateFields(models, models[0].name);
          }
        }

        function populateFields(models, selectedModel) {
          const model = models.find(m => m.name === selectedModel);
          const fieldsContainer = document.getElementById('fields');
          fieldsContainer.innerHTML = '';
          model.fields.forEach(field => {
            let div = document.createElement('div');
            div.innerHTML = \`
              <input type="checkbox" id="\${field.name}" value="\${field.name}">
              <label for="\${field.name}">\${field.name} (\${field.type})</label>
              <input type="text" id="condition_\${field.name}" placeholder="Condition">
            \`;
            fieldsContainer.appendChild(div);
          });
        }

        function submitSelection() {
          const model = document.getElementById('modelSelect').value;
          const selectedFields = [];
          document.querySelectorAll('#fields input[type="checkbox"]:checked').forEach(checkbox => {
            selectedFields.push({
              name: checkbox.value,
              condition: document.getElementById('condition_' + checkbox.value).value
            });
          });

          const vscode = acquireVsCodeApi();
          vscode.postMessage({
            command: 'submitSelection',
            data: {
              model,
              fields: selectedFields
            }
          });
        }
      </script>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #333; }
        select, button { margin: 10px 0; padding: 8px; }
        #fields div { margin: 8px 0; }
      </style>
    </head>
    <body>
      <h2>Prisma Schema Viewer</h2>
      <label for="modelSelect">Select Model:</label>
      <select id="modelSelect"></select>
      <h3>Fields:</h3>
      <div id="fields"></div>
      <button onclick="submitSelection()">Submit Selection</button>
    </body>
    </html>
  `;
} 