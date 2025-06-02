// Teste direto para debugar o problema da busca de alimentos
// Execute este script no console do navegador da página admin.html

// 1. Verificar os elementos
console.log('🔍 Verificando elementos DOM:');
console.log('selectPatientForFoods:', document.getElementById('selectPatientForFoods'));
console.log('foodsDate:', document.getElementById('foodsDate'));
console.log('loadFoodsBtn:', document.getElementById('loadFoodsBtn'));
console.log('foodsTableBody:', document.getElementById('foodsTableBody'));

// 2. Verificar os listeners atuais
console.log('\n🔉 Testando click no botão loadFoodsBtn:');
const btn = document.getElementById('loadFoodsBtn');

if (btn) {
    try {
        // Clonar o botão para remover todos os event listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Adicionar novo listener com uma função anônima para debugar
        newBtn.addEventListener('click', async function() {
            console.log('🔘 Botão clicado!');
            
            const patientId = document.getElementById('selectPatientForFoods').value;
            const date = document.getElementById('foodsDate').value;
            
            console.log('📊 Dados selecionados:', { patientId, date });
            
            // Tentar chamar a função diretamente
            try {
                console.log('📞 Chamando getPatientFoods diretamente...');
                const result = await AlimentaAIDataService.getPatientFoods(patientId, date);
                console.log('✅ Resultado da API:', result);
                
                if (result.success && result.foods && result.foods.length > 0) {
                    console.log('📋 Alimentos encontrados, renderizando...');
                    
                    // Renderizar tabela manualmente
                    const tbody = document.getElementById('foodsTableBody');
                    tbody.innerHTML = '';
                    
                    result.foods.forEach(food => {
                        const row = tbody.insertRow();
                        row.innerHTML = `
                            <td><span class="badge bg-secondary">${food.refeicao}</span></td>
                            <td>${food.nome}</td>
                            <td>${food.quantidade}</td>
                            <td>${food.calorias} kcal</td>
                            <td>${food.proteinas}g</td>
                            <td>${food.carboidratos}g</td>
                            <td>${food.gorduras}g</td>
                            <td>${food.horario}</td>
                        `;
                    });
                    
                    // Exibir resumo
                    const summary = document.getElementById('foodsSummary');
                    if (summary) {
                        summary.style.display = 'block';
                    }
                    
                    document.getElementById('totalCalories').textContent = result.totals.calories;
                    document.getElementById('totalProteins').textContent = result.totals.proteins;
                    document.getElementById('totalCarbs').textContent = result.totals.carbs;
                    document.getElementById('totalFats').textContent = result.totals.fats;
                    
                    alert(`Sucesso! ${result.foods.length} alimentos encontrados.`);
                } else {
                    document.getElementById('foodsTableBody').innerHTML = '<tr><td colspan="8" class="text-center">Nenhum alimento encontrado para a data selecionada</td></tr>';
                    document.getElementById('foodsSummary').style.display = 'none';
                    alert('Nenhum alimento encontrado para a data selecionada.');
                }
            } catch (error) {
                console.error('❌ Erro:', error);
                alert(`Erro: ${error.message}`);
            }
        });
        
        console.log('✅ Novo event listener adicionado ao botão!');
    } catch (error) {
        console.error('❌ Erro ao manipular botão:', error);
    }
} else {
    console.log('❌ Botão não encontrado!');
}

console.log('\n💡 Instruções:');
console.log('1. Selecione um paciente');
console.log('2. Escolha uma data (2025-06-01 deve ter dados)');
console.log('3. Clique no botão "Buscar" para testar');
