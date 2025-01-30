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
        flex-direction: column;
        padding: 8px 0;
        border-bottom: 1px solid #444;
      }
      .field:last-child {
        border-bottom: none;
      }
      .field-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .field-name {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .field-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .sort-button {
        background: #3d3d4a;
        border: none;
        color: #c9d1d9;
        padding: 2px 6px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        min-width: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .sort-button.active {
        background: #008cba;
      }
      .sort-button.asc::after {
        content: "↑";
      }
      .sort-button.desc::after {
        content: "↓";
      }
      .sort-order {
        font-size: 10px;
        color: #888;
        min-width: 16px;
        text-align: center;
      }
      .field-conditions {
        display: none;
        margin-top: 5px;
        flex-direction: column;
        gap: 5px;
      }
      .field-conditions.active {
        display: flex;
      }
      .condition-row {
        display: flex;
        gap: 5px;
        align-items: center;
      }
      .condition-operator {
        background: #3d3d4a;
        border: 1px solid #555;
        color: #c9d1d9;
        padding: 3px;
        border-radius: 3px;
      }
      .condition-value {
        background: #3d3d4a;
        border: 1px solid #555;
        color: #c9d1d9;
        padding: 3px;
        border-radius: 3px;
        width: 100px;
      }
      .condition-logic {
        background: #3d3d4a;
        border: 1px solid #555;
        color: #c9d1d9;
        padding: 3px 8px;
        border-radius: 3px;
        cursor: pointer;
      }
      .add-condition {
        background: #2d2d3a;
        border: 1px dashed #555;
        color: #c9d1d9;
        padding: 3px 8px;
        border-radius: 3px;
        cursor: pointer;
        margin-top: 5px;
        align-self: flex-start;
      }
      .remove-condition {
        background: #3d3d4a;
        border: none;
        color: #ff6b6b;
        padding: 3px 8px;
        border-radius: 3px;
        cursor: pointer;
      }
      .relation-fields {
        margin-left: 20px;
        border-left: 2px solid #444;
        padding-left: 10px;
        margin-top: 5px;
        display: none;
      }
      .relation-fields.active {
        display: block;
      }
      .relation-toggle {
        background: #3d3d4a;
        border: 1px solid #555;
        color: #c9d1d9;
        padding: 2px 6px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        margin-left: 8px;
      }
      .relation-indicator {
        font-size: 12px;
        color: #888;
        margin-left: 5px;
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

      function getOperatorsForType(type) {
        const stringOperators = ['equals', 'contains', 'startsWith', 'endsWith'];
        const numberOperators = ['equals', 'gt', 'gte', 'lt', 'lte'];
        const booleanOperators = ['equals'];
        const dateOperators = ['equals', 'gt', 'gte', 'lt', 'lte'];

        switch(type.toLowerCase()) {
          case 'string':
            return stringOperators;
          case 'int':
          case 'float':
          case 'decimal':
            return numberOperators;
          case 'boolean':
            return booleanOperators;
          case 'datetime':
            return dateOperators;
          default:
            return stringOperators;
        }
      }

      function createFieldActions(field, table, fieldDiv) {
        const fieldActions = document.createElement('div');
        fieldActions.className = 'field-actions';

        // ソートボタンの追加
        const sortButton = document.createElement('button');
        sortButton.className = 'sort-button';
        sortButton.setAttribute('data-field-name', field.name);
        
        // ソート順序表示
        const sortOrder = document.createElement('span');
        sortOrder.className = 'sort-order';
        
        sortButton.onclick = () => {
          const currentState = sortButton.getAttribute('data-sort-state') || 'none';
          const allSortButtons = table.querySelectorAll('.sort-button');
          const sortedButtons = Array.from(allSortButtons).filter(btn => 
            btn.getAttribute('data-sort-state') && 
            btn.getAttribute('data-sort-state') !== 'none'
          );

          // ソート状態の更新
          let newState;
          switch (currentState) {
            case 'none':
              newState = 'asc';
              break;
            case 'asc':
              newState = 'desc';
              break;
            case 'desc':
              newState = 'none';
              break;
          }

          // ソート順序の更新
          if (newState === 'none') {
            sortButton.className = 'sort-button';
            sortButton.setAttribute('data-sort-state', 'none');
            sortOrder.textContent = '';
            
            // 他のソート順序を更新
            updateSortOrders(table);
          } else {
            const order = sortedButtons.length + 1;
            sortButton.className = \`sort-button active \${newState}\`;
            sortButton.setAttribute('data-sort-state', newState);
            sortOrder.textContent = order;
          }
        };

        // チェックボックスの作成
        const fieldCheckbox = document.createElement('input');
        fieldCheckbox.type = 'checkbox';
        fieldCheckbox.setAttribute('data-field-name', field.name);
        fieldCheckbox.onchange = (event) => {
          // 親要素のfieldDivを探す
          const currentFieldDiv = event.target.closest('.field');
          if (currentFieldDiv) {
            const conditionsDiv = currentFieldDiv.querySelector('.field-conditions');
            if (conditionsDiv) {
              conditionsDiv.classList.toggle('active', fieldCheckbox.checked);
            }
          }
        };

        fieldActions.appendChild(sortOrder);
        fieldActions.appendChild(sortButton);
        fieldActions.appendChild(fieldCheckbox);

        return { fieldActions, fieldCheckbox };
      }

      function updateSortOrders(table) {
        const sortedButtons = Array.from(table.querySelectorAll('.sort-button'))
          .filter(btn => btn.getAttribute('data-sort-state') && btn.getAttribute('data-sort-state') !== 'none')
          .sort((a, b) => {
            const orderA = parseInt(a.previousElementSibling.textContent) || 0;
            const orderB = parseInt(b.previousElementSibling.textContent) || 0;
            return orderA - orderB;
          });

        sortedButtons.forEach((btn, index) => {
          btn.previousElementSibling.textContent = (index + 1).toString();
        });
      }

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
          table.setAttribute('data-model', model.name);

          const header = document.createElement('div');
          header.className = 'table-header';

          const tableTitle = document.createElement('span');
          tableTitle.textContent = model.name;

          const selectAllCheckbox = document.createElement('input');
          selectAllCheckbox.type = 'checkbox';
          selectAllCheckbox.onclick = () => {
            const checkboxes = table.querySelectorAll('.field-header > .field-actions > input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
              checkbox.checked = selectAllCheckbox.checked;
              // チェックボックスの変更イベントを手動で発火
              const event = new Event('change', { bubbles: true });
              checkbox.dispatchEvent(event);
            });
          };

          header.appendChild(tableTitle);
          header.appendChild(selectAllCheckbox);
          table.appendChild(header);

          model.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'field';

            const fieldHeader = document.createElement('div');
            fieldHeader.className = 'field-header';

            const fieldNameContainer = document.createElement('div');
            fieldNameContainer.className = 'field-name';

            const fieldName = document.createElement('span');
            fieldName.textContent = field.name;

            const fieldType = document.createElement('span');
            fieldType.textContent = \` (\${field.type})\`;

            fieldNameContainer.appendChild(fieldName);
            fieldNameContainer.appendChild(fieldType);

            if (field.relation) {
              const relationIndicator = document.createElement('span');
              relationIndicator.className = 'relation-indicator';
              relationIndicator.textContent = \`→ \${field.relation.target}\`;
              fieldNameContainer.appendChild(relationIndicator);

              const relationToggle = document.createElement('button');
              relationToggle.className = 'relation-toggle';
              relationToggle.textContent = 'Select fields';
              relationToggle.onclick = () => {
                const relatedModel = models.find(m => m.name === field.relation.target);
                if (relatedModel) {
                  const existingRelationFields = fieldDiv.querySelector('.relation-fields');
                  if (existingRelationFields) {
                    existingRelationFields.classList.toggle('active');
                  } else {
                    const relationFields = createRelationFields(relatedModel, models);
                    fieldDiv.appendChild(relationFields);
                    relationFields.classList.add('active');
                  }
                }
              };
              fieldNameContainer.appendChild(relationToggle);
            }

            const { fieldActions, fieldCheckbox } = createFieldActions(field, table, fieldDiv);

            fieldHeader.appendChild(fieldNameContainer);
            fieldHeader.appendChild(fieldActions);
            fieldDiv.appendChild(fieldHeader);

            // 条件設定UI
            const conditionsDiv = document.createElement('div');
            conditionsDiv.className = 'field-conditions';

            const initialConditionRow = createConditionRow(field.type);
            conditionsDiv.appendChild(initialConditionRow);

            const addButton = document.createElement('button');
            addButton.className = 'add-condition';
            addButton.textContent = '+ Add condition';
            addButton.onclick = () => {
              const newConditionRow = createConditionRow(field.type);
              conditionsDiv.insertBefore(newConditionRow, addButton);
            };
            conditionsDiv.appendChild(addButton);

            fieldDiv.appendChild(conditionsDiv);
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

      function createConditionRow(fieldType) {
        const conditionRow = document.createElement('div');
        conditionRow.className = 'condition-row';

        // Logic selector (AND/OR)
        const logicSelect = document.createElement('select');
        logicSelect.className = 'condition-logic';
        ['AND', 'OR'].forEach(logic => {
          const option = document.createElement('option');
          option.value = logic;
          option.textContent = logic;
          logicSelect.appendChild(option);
        });

        // Operator selector
        const operatorSelect = document.createElement('select');
        operatorSelect.className = 'condition-operator';
        const operators = getOperatorsForType(fieldType);
        operators.forEach(op => {
          const option = document.createElement('option');
          option.value = op;
          option.textContent = op;
          operatorSelect.appendChild(option);
        });

        // Value input
        const valueInput = document.createElement('input');
        valueInput.type = fieldType.toLowerCase() === 'boolean' ? 'checkbox' : 'text';
        valueInput.className = 'condition-value';

        // Remove button
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-condition';
        removeButton.textContent = '×';
        removeButton.onclick = () => conditionRow.remove();

        conditionRow.appendChild(logicSelect);
        conditionRow.appendChild(operatorSelect);
        conditionRow.appendChild(valueInput);
        conditionRow.appendChild(removeButton);

        return conditionRow;
      }

      function createRelationFields(model, allModels, depth = 0) {
        if (depth > 2) return null; // 深さの制限（パフォーマンスのため）

        const relationFields = document.createElement('div');
        relationFields.className = 'relation-fields';

        model.fields.forEach(field => {
          const fieldDiv = document.createElement('div');
          fieldDiv.className = 'field';

          const fieldHeader = document.createElement('div');
          fieldHeader.className = 'field-header';

          const fieldNameContainer = document.createElement('div');
          fieldNameContainer.className = 'field-name';

          const fieldName = document.createElement('span');
          fieldName.textContent = field.name;

          const fieldType = document.createElement('span');
          fieldType.textContent = \` (\${field.type})\`;

          fieldNameContainer.appendChild(fieldName);
          fieldNameContainer.appendChild(fieldType);

          if (field.relation) {
            const relationIndicator = document.createElement('span');
            relationIndicator.className = 'relation-indicator';
            relationIndicator.textContent = \`→ \${field.relation.target}\`;
            fieldNameContainer.appendChild(relationIndicator);

            const relationToggle = document.createElement('button');
            relationToggle.className = 'relation-toggle';
            relationToggle.textContent = 'Select fields';
            relationToggle.onclick = () => {
              const relatedModel = allModels.find(m => m.name === field.relation.target);
              if (relatedModel) {
                const existingRelationFields = fieldDiv.querySelector('.relation-fields');
                if (existingRelationFields) {
                  existingRelationFields.classList.toggle('active');
                } else {
                  const nestedRelationFields = createRelationFields(relatedModel, allModels, depth + 1);
                  if (nestedRelationFields) {
                    fieldDiv.appendChild(nestedRelationFields);
                    nestedRelationFields.classList.add('active');
                  }
                }
              }
            };
            fieldNameContainer.appendChild(relationToggle);
          }

          const fieldCheckbox = document.createElement('input');
          fieldCheckbox.type = 'checkbox';
          fieldCheckbox.setAttribute('data-field-name', field.name);
          fieldCheckbox.setAttribute('data-relation-depth', depth.toString());

          fieldHeader.appendChild(fieldNameContainer);
          fieldHeader.appendChild(fieldCheckbox);
          fieldDiv.appendChild(fieldHeader);

          // 条件設定UI
          const conditionsDiv = document.createElement('div');
          conditionsDiv.className = 'field-conditions';

          const initialConditionRow = createConditionRow(field.type);
          conditionsDiv.appendChild(initialConditionRow);

          const addButton = document.createElement('button');
          addButton.className = 'add-condition';
          addButton.textContent = '+ Add condition';
          addButton.onclick = () => {
            const newConditionRow = createConditionRow(field.type);
            conditionsDiv.insertBefore(newConditionRow, addButton);
          };
          conditionsDiv.appendChild(addButton);

          fieldDiv.appendChild(conditionsDiv);
          relationFields.appendChild(fieldDiv);
        });

        return relationFields;
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
          const tableName = table.getAttribute('data-model');
          const selectedFields = {};
          const whereConditions = {};
          const orderByFields = [];

          // ソート順の収集
          table.querySelectorAll('.sort-button').forEach(button => {
            const state = button.getAttribute('data-sort-state');
            if (state && state !== 'none') {
              const fieldName = button.getAttribute('data-field-name');
              const order = button.previousElementSibling.textContent;
              if (fieldName && order) {
                orderByFields.push({
                  field: fieldName,
                  order: state.toUpperCase(),
                  priority: parseInt(order)
                });
              }
            }
          });

          // orderByFieldsを優先度でソート
          orderByFields.sort((a, b) => a.priority - b.priority);

          function processFields(parentElement, isRelation = false) {
            const fields = {};
            
            parentElement.querySelectorAll(':scope > .field').forEach(fieldDiv => {
              const checkbox = fieldDiv.querySelector('input[type="checkbox"]');
              if (checkbox && checkbox.checked) {
                const fieldName = checkbox.getAttribute('data-field-name');
                
                // リレーションフィールドの処理
                const relationFields = fieldDiv.querySelector('.relation-fields');
                if (relationFields && relationFields.classList.contains('active')) {
                  const nestedFields = processFields(relationFields, true);
                  if (Object.keys(nestedFields).length > 0) {
                    fields[fieldName] = {
                      select: nestedFields
                    };
                  }
                } else if (!isRelation || !relationFields) {
                  // 通常のフィールドまたは選択されていないリレーションフィールド
                  fields[fieldName] = true;
                }

                // Where条件の処理
                const conditionsDiv = fieldDiv.querySelector('.field-conditions');
                if (conditionsDiv && conditionsDiv.classList.contains('active')) {
                  const conditions = [];
                  conditionsDiv.querySelectorAll('.condition-row').forEach((row, index) => {
                    const logic = row.querySelector('.condition-logic').value;
                    const operator = row.querySelector('.condition-operator').value;
                    const value = row.querySelector('.condition-value').value;
                    
                    if (value) {
                      if (index === 0) {
                        conditions.push({ [operator]: value });
                      } else {
                        const condition = {};
                        condition[logic.toLowerCase()] = [
                          conditions.pop(),
                          { [operator]: value }
                        ];
                        conditions.push(condition);
                      }
                    }
                  });

                  if (conditions.length > 0) {
                    whereConditions[fieldName] = conditions[0];
                  }
                }
              }
            });

            return fields;
          }

          const mainFields = processFields(table, false);
          
          if (Object.keys(mainFields).length > 0) {
            selectedTables.push({ 
              tableName, 
              fields: mainFields,
              where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
              orderBy: orderByFields.length > 0 ? orderByFields : undefined
            });
          }
        });

        displayGeneratedCode(selectedTables);
      }

      function displayGeneratedCode(selectedTables) {
        let code = '';

        selectedTables.forEach(table => {
          code += \`const res = await prisma.\${table.tableName.toLowerCase()}.findMany({\n\`;
          
          // Select/Include句の生成
          if (typeof table.fields === 'object') {
            code += \`  select: {\n\`;
            Object.entries(table.fields).forEach(([field, value]) => {
              if (typeof value === 'object') {
                code += generateSelectClause(field, value, 2);
              } else {
                code += \`    \${field}: true,\n\`;
              }
            });
            code += \`  },\n\`;
          }

          // Where句の生成
          if (table.where) {
            code += \`  where: {\n\`;
            Object.entries(table.where).forEach(([field, condition]) => {
              code += generateWhereCondition(field, condition, 2);
            });
            code += \`  },\n\`;
          }

          // OrderBy句の生成
          if (table.orderBy) {
            if (table.orderBy.length === 1) {
              code += \`  orderBy: { \${table.orderBy[0].field}: '\${table.orderBy[0].order}' },\n\`;
            } else if (table.orderBy.length > 1) {
              code += \`  orderBy: [\n\`;
              table.orderBy.forEach(({ field, order }) => {
                code += \`    { \${field}: '\${order}' },\n\`;
              });
              code += \`  ],\n\`;
            }
          }

          code += \`});\n\n\`;
        });

        document.getElementById('generatedCode').innerText = code;
      }

      function generateSelectClause(field, value, depth) {
        const indent = ' '.repeat(depth * 2);
        let code = \`\${indent}\${field}: {\n\`;
        
        if (value.select) {
          code += \`\${indent}  select: {\n\`;
          Object.entries(value.select).forEach(([subField, subValue]) => {
            if (typeof subValue === 'object') {
              code += generateSelectClause(subField, subValue, depth + 2);
            } else {
              code += \`\${indent}    \${subField}: true,\n\`;
            }
          });
          code += \`\${indent}  }\n\`;
        }
        
        code += \`\${indent}},\n\`;
        return code;
      }

      function generateWhereCondition(field, condition, indent) {
        const spaces = ' '.repeat(indent * 2);
        let code = '';

        if (condition.and || condition.or) {
          const logicOp = condition.and ? 'AND' : 'OR';
          const conditions = condition.and || condition.or;
          code += \`\${spaces}\${field}: {\n\`;
          code += \`\${spaces}  \${logicOp.toLowerCase()}: [\n\`;
          conditions.forEach(cond => {
            if (cond.and || cond.or) {
              code += generateWhereCondition('', cond, indent + 2);
            } else {
              const [op, value] = Object.entries(cond)[0];
              code += \`\${spaces}    { \${op}: \${JSON.stringify(value)} },\n\`;
            }
          });
          code += \`\${spaces}  ]\n\`;
          code += \`\${spaces}},\n\`;
        } else {
          const [op, value] = Object.entries(condition)[0];
          code += \`\${spaces}\${field}: { \${op}: \${JSON.stringify(value)} },\n\`;
        }

        return code;
      }
    </script>
  `;
}
