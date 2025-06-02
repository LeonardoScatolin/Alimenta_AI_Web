(function(window) {
    'use strict';

    const API_BASE_URL = 'http://127.0.0.1:3333'; // URL da sua API BackAlimenta

    const DataService = {
        authenticateAdmin: async function(email, password) {
            try {
                console.log('🔐 Tentando login da nutricionista...', { email });
                
                const response = await fetch(`${API_BASE_URL}/nutri/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, senha: password })
                });
                
                const data = await response.json();
                console.log('📡 Resposta da API:', data);
                
                if (data.status && data.token) {
                    // Salvar dados da nutricionista logada
                    const adminInfo = {
                        id: data.nutri.nutri_id,
                        email: data.nutri.email,
                        name: data.nutri.nome,
                        token: data.token
                    };
                    
                    localStorage.setItem('adminLoggedIn', 'true');
                    localStorage.setItem('adminUser', JSON.stringify(adminInfo));
                    
                    console.log('✅ Login bem-sucedido!', adminInfo);
                    
                    return {
                        success: true,
                        admin: adminInfo
                    };
                } else {
                    console.log('❌ Falha no login:', data.message || data.error);
                    localStorage.removeItem('adminLoggedIn');
                    localStorage.removeItem('adminUser');
                    return {
                        success: false,
                        message: data.message || data.error || 'Credenciais inválidas'
                    };
                }
            } catch (error) {
                console.error('❌ Erro na requisição de login:', error);
                localStorage.removeItem('adminLoggedIn');
                localStorage.removeItem('adminUser');
                return {
                    success: false,
                    message: 'Erro de conexão. Verifique se a API está rodando.'
                };
            }
        },

        isAdminLoggedIn: function() {
            return localStorage.getItem('adminLoggedIn') === 'true';
        },

        getLoggedInAdminInfo: function() {
            if (this.isAdminLoggedIn()) {
                try { 
                    return JSON.parse(localStorage.getItem('adminUser')); 
                } catch (e) { 
                    return null; 
                }
            }
            return null;
        },

        logoutAdmin: async function() {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUser');
            return { success: true };
        },

        getPatients: async function() {
            try {
                const adminInfo = this.getLoggedInAdminInfo();
                if (!adminInfo || !adminInfo.id) {
                    return { success: false, message: 'Usuário não autenticado' };
                }

                console.log('👥 Buscando pacientes da nutricionista ID:', adminInfo.id);

                const response = await fetch(`${API_BASE_URL}/nutri/pacientes/${adminInfo.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminInfo.token}`
                    }
                });                const data = await response.json();
                console.log('📡 Resposta dos pacientes:', data);

                if (data.status && data.pacientes) {
                    console.log('✅ Pacientes encontrados:', data.pacientes.length);
                    
                    // Transformar dados para o formato esperado pelo front-end
                    const patients = data.pacientes.map(p => {
                        console.log('🔄 Transformando paciente:', p);
                        return {
                            id: p.paciente_id,
                            name: p.nome,
                            email: p.email,
                            phone: p.telefone || '',
                            status: p.ativo ? 'active' : 'inactive',
                            macros: { 
                                calories: p.calorias_meta || 2000, 
                                proteins: p.proteina_meta || 150, 
                                carbs: p.carbo_meta || 200, 
                                fats: p.gordura_meta || 70 
                            },
                            createdAt: p.data_criacao || new Date().toISOString()
                        };
                    });

                    console.log('✅ Pacientes transformados:', patients);
                    return { success: true, patients };
                } else {
                    console.log('⚠️ Nenhum paciente encontrado ou erro:', data.message);
                    return { success: false, message: data.message || 'Erro ao buscar pacientes', patients: [] };
                }
            } catch (error) {
                console.error('❌ Erro ao buscar pacientes:', error);
                return { success: false, message: 'Erro de conexão', patients: [] };
            }
        },

        addPatient: async function(patientData) {
            try {
                const adminInfo = this.getLoggedInAdminInfo();
                if (!adminInfo || !adminInfo.id) {
                    return { success: false, message: 'Usuário não autenticado' };
                }

                console.log('➕ Adicionando novo paciente...', patientData);

                const response = await fetch(`${API_BASE_URL}/paciente/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminInfo.token}`
                    },
                    body: JSON.stringify({
                        nome: patientData.name,
                        email: patientData.email,
                        senha: patientData.password,
                        telefone: patientData.phone,
                        peso: 70, // Peso padrão
                        nutri_id: adminInfo.id
                    })
                });

                const data = await response.json();
                console.log('📡 Resposta do cadastro:', data);

                if (data.status) {
                    return { 
                        success: true, 
                        message: 'Paciente adicionado com sucesso!' 
                    };
                } else {
                    return { 
                        success: false, 
                        message: data.message || data.error || 'Erro ao adicionar paciente' 
                    };
                }
            } catch (error) {
                console.error('❌ Erro ao adicionar paciente:', error);
                return { success: false, message: 'Erro de conexão' };
            }
        },

        // Buscar macros atuais de um paciente
        getPatientMacros: async function(patientId) {
            try {
                const adminInfo = this.getLoggedInAdminInfo();
                if (!adminInfo || !adminInfo.token) {
                    return { success: false, message: 'Usuário não autenticado' };
                }

                console.log('🎯 Buscando macros do paciente:', patientId);

                const response = await fetch(`${API_BASE_URL}/pacientes/${patientId}/macros`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminInfo.token}`
                    }
                });

                if (!response.ok) {
                    console.error('❌ Erro HTTP ao buscar macros:', response.status);
                    return { 
                        success: false, 
                        message: `Erro HTTP ${response.status}` 
                    };
                }

                const data = await response.json();
                console.log('📊 Macros recebidos:', data);

                return data;
            } catch (error) {
                console.error('❌ Erro ao buscar macros:', error);
                return { 
                    success: false, 
                    message: 'Erro de conexão' 
                };
            }
        },

        // Salvar macros de um paciente
        savePatientMacros: async function(patientId, macros) {
            try {
                const adminInfo = this.getLoggedInAdminInfo();
                if (!adminInfo || !adminInfo.token) {
                    return { success: false, message: 'Usuário não autenticado' };
                }

                console.log('💾 Salvando macros do paciente:', { patientId, macros });

                const response = await fetch(`${API_BASE_URL}/pacientes/${patientId}/macros`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminInfo.token}`
                    },
                    body: JSON.stringify(macros)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Erro HTTP ao salvar macros:', response.status, errorText);
                    return { 
                        success: false, 
                        message: `Erro HTTP ${response.status}` 
                    };
                }

                const data = await response.json();
                console.log('✅ Resposta do servidor:', data);

                return data;
            } catch (error) {
                console.error('❌ Erro ao salvar macros:', error);
                return { 
                    success: false, 
                    message: 'Erro de conexão' 
                };
            }
        },        getPatientFoods: async function(patientId, date) {
            console.log('🚀 FRONTEND: getPatientFoods INICIOU');
            console.log('🚀 FRONTEND: Parâmetros recebidos:', { patientId, date });
            
            try {
                const adminInfo = this.getLoggedInAdminInfo();
                console.log('🚀 FRONTEND: adminInfo obtido:', adminInfo ? 'PRESENTE' : 'AUSENTE');
                
                if (!adminInfo || !adminInfo.token) {
                    console.log('❌ FRONTEND: Usuário não autenticado');
                    return { success: false, message: 'Usuário não autenticado' };
                }

                console.log('🍽️ FRONTEND: Buscando alimentos do paciente:', { 
                    patientId, 
                    patientIdType: typeof patientId,
                    date, 
                    dateType: typeof date,
                    token: adminInfo.token ? `${adminInfo.token.substring(0, 10)}...` : 'AUSENTE'
                });

                const url = `${API_BASE_URL}/alimentos-detalhados/data/${patientId}${date ? `?data=${date}` : ''}`;
                console.log('🔗 FRONTEND: URL completa:', url);
                console.log('🔗 FRONTEND: API_BASE_URL:', API_BASE_URL);
                
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminInfo.token}`
                };
                console.log('📨 FRONTEND: Headers:', headers);

                console.log('📡 FRONTEND: Fazendo fetch...');
                const response = await fetch(url, {
                    method: 'GET',
                    headers: headers
                });

                console.log('📡 FRONTEND: Status da resposta:', response.status, response.statusText);
                console.log('📡 FRONTEND: Response object:', response);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.log('❌ Erro HTTP:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorText: errorText
                    });
                    return { 
                        success: false, 
                        message: `Erro HTTP ${response.status}: ${errorText || response.statusText}`,
                        foods: [],
                        totals: { calories: 0, proteins: 0, carbs: 0, fats: 0 }
                    };
                }                const data = await response.json();
                console.log('📡 Resposta completa dos alimentos:', JSON.stringify(data, null, 2));

                // Novo formato: o backend retorna { success: true, foods: [...], totals: {...} }
                if (data.success && data.foods) {
                    console.log('✅ FRONTEND: Dados no formato correto, processando...');
                    console.log('✅ FRONTEND: Total de alimentos recebidos:', data.foods.length);                    // Mapear dados para o formato esperado pelo admin.js
                    const foods = data.foods.map(food => ({
                        refeicao: food.refeicao ? food.refeicao.replace('_', ' ').toUpperCase() : 'N/A',
                        nome_alimento: food.nome || food.alimento_nome || 'N/A',
                        quantidade: food.quantidade || '0g', // Já vem formatado do backend como "100g"
                        calorias: food.calorias || 0,
                        proteina: food.proteinas || 0,
                        carboidrato: food.carboidratos || 0,
                        gordura: food.gorduras || 0,
                        data_consumo: food.horario || null, // horario já vem formatado do backend
                        horario: food.horario || '--'
                    }));

                    const totals = {
                        total_calorias: data.totals?.calories || 0,
                        total_proteina: data.totals?.proteins || 0,
                        total_carboidrato: data.totals?.carbs || 0,
                        total_gordura: data.totals?.fats || 0
                    };

                    console.log('✅ FRONTEND: Alimentos processados:', { totalFoods: foods.length, totals });

                    return { 
                        success: true, 
                        foods,
                        totals,
                        totalItems: foods.length,
                        message: data.message || `${foods.length} alimento(s) encontrado(s)`
                    };
                }
                
                // Formato antigo (mantido para compatibilidade)
                else if (data.status && data.data && data.data.refeicoes) {
                    console.log('✅ FRONTEND: Dados no formato antigo, processando...');
                    // Transformar dados para o formato da tabela
                    const foods = [];
                    let totals = { calories: 0, proteins: 0, carbs: 0, fats: 0 };

                    Object.keys(data.data.refeicoes).forEach(tipoRefeicao => {
                        const refeicaoData = data.data.refeicoes[tipoRefeicao];
                        
                        if (refeicaoData.alimentos && refeicaoData.alimentos.length > 0) {
                            refeicaoData.alimentos.forEach(alimento => {
                                foods.push({
                                    refeicao: tipoRefeicao.replace('_', ' ').toUpperCase(),
                                    nome: alimento.alimento_nome,
                                    quantidade: `${alimento.quantidade_gramas}g`,
                                    calorias: Math.round(alimento.calorias_item || 0),
                                    proteinas: Math.round(alimento.proteinas_item || 0),
                                    carboidratos: Math.round(alimento.carboidratos_item || 0),
                                    gorduras: Math.round(alimento.gordura_item || 0),
                                    horario: alimento.hora_consumo || '--'
                                });

                                // Somar totais
                                totals.calories += alimento.calorias_item || 0;
                                totals.proteins += alimento.proteinas_item || 0;
                                totals.carbs += alimento.carboidratos_item || 0;
                                totals.fats += alimento.gordura_item || 0;
                            });
                        }
                    });

                    // Arredondar totais
                    totals.calories = Math.round(totals.calories);
                    totals.proteins = Math.round(totals.proteins);
                    totals.carbs = Math.round(totals.carbs);
                    totals.fats = Math.round(totals.fats);

                    console.log('✅ Alimentos processados:', { totalFoods: foods.length, totals });

                    return { 
                        success: true, 
                        foods,
                        totals,
                        totalItems: foods.length
                    };
                } else {
                    console.log('❌ FRONTEND: Formato de dados não reconhecido:', data);
                    return { 
                        success: false, 
                        message: data.message || 'Nenhum alimento encontrado',
                        foods: [],
                        totals: { calories: 0, proteins: 0, carbs: 0, fats: 0 }
                    };
                }
            } catch (error) {
                console.error('❌ Erro ao buscar alimentos:', error);
                return { 
                    success: false, 
                    message: 'Erro de conexão',
                    foods: [],
                    totals: { calories: 0, proteins: 0, carbs: 0, fats: 0 }
                };
            }
        },
          updatePatientDetails: async function(patientId, dataToUpdate) {
            try {
                const adminInfo = this.getLoggedInAdminInfo();
                if (!adminInfo || !adminInfo.token) {
                    return { success: false, message: 'Usuário não autenticado' };
                }                console.log('✏️ Atualizando dados do paciente:', { patientId, dataToUpdate });
                console.log('🌐 URL da requisição:', `${API_BASE_URL}/pacientes/${patientId}`);
                console.log('🔑 Token (primeiros 20 chars):', adminInfo.token ? adminInfo.token.substring(0, 20) + '...' : 'AUSENTE');

                // Mapear campos do frontend para backend
                const dadosBackend = {};
                if (dataToUpdate.name) dadosBackend.name = dataToUpdate.name;
                if (dataToUpdate.email) dadosBackend.email = dataToUpdate.email;
                if (dataToUpdate.phone) dadosBackend.phone = dataToUpdate.phone;

                console.log('📦 Dados mapeados para backend:', dadosBackend);

                const response = await fetch(`${API_BASE_URL}/pacientes/${patientId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminInfo.token}`
                    },
                    body: JSON.stringify(dadosBackend)
                });

                console.log('📡 Status da resposta:', response.status, response.statusText);
                console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));

                if (!response.ok) {
                    const errorText = await response.text();
                    console.log('❌ Erro HTTP (texto):', errorText);
                    return { 
                        success: false, 
                        message: `Erro HTTP ${response.status}: ${response.statusText}`
                    };
                }

                const responseText = await response.text();
                console.log('📡 Resposta bruta:', responseText);

                let data;
                try {
                    data = JSON.parse(responseText);
                    console.log('📡 Resposta da atualização (JSON):', data);
                } catch (parseError) {
                    console.error('❌ Erro ao fazer parse do JSON:', parseError);
                    console.log('📄 Conteúdo da resposta:', responseText.substring(0, 500));
                    return { 
                        success: false, 
                        message: 'Erro: Resposta inválida do servidor'
                    };
                }                // Se chegou até aqui com status 200, a atualização foi bem-sucedida
                // mesmo que o backend retorne status: false (bug conhecido)
                if (response.status === 200) {
                    console.log('✅ Atualização bem-sucedida (status HTTP 200)');
                    return { 
                        success: true, 
                        status: true, // Forçar status true para o frontend
                        message: 'Dados do paciente atualizados com sucesso'
                    };
                } else if (data.status) {
                    return { 
                        success: true, 
                        status: true,
                        message: data.message || 'Dados do paciente atualizados com sucesso'
                    };
                } else {
                    return { 
                        success: false, 
                        status: false,
                        message: data.message || 'Erro ao atualizar dados do paciente'
                    };
                }
            } catch (error) {
                console.error('❌ Erro ao atualizar paciente:', error);
                return { 
                    success: false, 
                    message: 'Erro de conexão'
                };
            }
        },getPatientById: async function(patientId) {
            try {
                console.log('🔍 Buscando paciente por ID:', patientId, typeof patientId);
                
                const patientsResult = await this.getPatients();
                console.log('📦 Resultado da busca de pacientes:', patientsResult);
                
                if (patientsResult.success && patientsResult.patients) {
                    console.log('👥 Pacientes disponíveis:', patientsResult.patients.map(p => ({ id: p.id, name: p.name })));
                    
                    // Tentar encontrar por ID (string e número)
                    let patient = patientsResult.patients.find(p => p.id === patientId);
                    if (!patient) {
                        // Tentar conversão de tipos
                        patient = patientsResult.patients.find(p => String(p.id) === String(patientId));
                    }
                    if (!patient) {
                        // Tentar como número
                        patient = patientsResult.patients.find(p => p.id === parseInt(patientId));
                    }
                    
                    console.log('🎯 Paciente encontrado:', patient);
                    return patient;
                }
                console.log('❌ Nenhum paciente encontrado');
                return null;
            } catch (error) {
                console.error('❌ Erro ao buscar paciente por ID:', error);
                return null;
            }
        },        removePatient: async function(patientEmailOrId) {
            try {
                const adminInfo = this.getLoggedInAdminInfo();
                if (!adminInfo || !adminInfo.token) {
                    return { success: false, message: 'Usuário não autenticado' };
                }

                console.log('🗑️ Removendo paciente:', { 
                    patientEmailOrId, 
                    url: `${API_BASE_URL}/pacientes/${patientEmailOrId}`,
                    token: adminInfo.token ? 'Presente' : 'Ausente'
                });

                const response = await fetch(`${API_BASE_URL}/pacientes/${patientEmailOrId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminInfo.token}`
                    }
                });

                console.log('📡 Status da resposta:', response.status);
                console.log('📡 Headers da resposta:', response.headers);

                const data = await response.json();
                console.log('📡 Resposta completa da remoção:', data);

                if (response.ok && data.status) {
                    return { 
                        success: true, 
                        message: data.message || 'Paciente removido com sucesso'
                    };
                } else {
                    console.error('❌ Falha na remoção:', { status: response.status, data });
                    return { 
                        success: false, 
                        message: data.message || data.error || 'Erro ao remover paciente'
                    };
                }
            } catch (error) {
                console.error('❌ Erro crítico ao remover paciente:', error);
                return { 
                    success: false, 
                    message: 'Erro de conexão: ' + error.message
                };
            }
        },updatePatientPassword: async function(patientEmailOrId, newPassword) {
            try {
                const adminInfo = this.getLoggedInAdminInfo();
                if (!adminInfo || !adminInfo.token) {
                    return { success: false, message: 'Usuário não autenticado' };
                }

                console.log('🔐 Alterando senha do paciente:', { patientEmailOrId });
                console.log('🌐 URL da requisição:', `${API_BASE_URL}/pacientes/alterar-senha`);
                console.log('🔑 Token (primeiros 20 chars):', adminInfo.token ? adminInfo.token.substring(0, 20) + '...' : 'AUSENTE');

                const response = await fetch(`${API_BASE_URL}/pacientes/alterar-senha`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminInfo.token}`
                    },
                    body: JSON.stringify({
                        email: patientEmailOrId,
                        newPassword: newPassword
                    })
                });

                console.log('📡 Status da resposta:', response.status, response.statusText);
                console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));

                if (!response.ok) {
                    const errorText = await response.text();
                    console.log('❌ Erro HTTP (texto):', errorText);
                    return { 
                        success: false, 
                        message: `Erro HTTP ${response.status}: ${response.statusText}`
                    };
                }

                const responseText = await response.text();
                console.log('📡 Resposta bruta:', responseText);

                let data;
                try {
                    data = JSON.parse(responseText);
                    console.log('📡 Resposta da alteração de senha (JSON):', data);
                } catch (parseError) {
                    console.error('❌ Erro ao fazer parse do JSON:', parseError);
                    console.log('📄 Conteúdo da resposta:', responseText.substring(0, 500));
                    return { 
                        success: false, 
                        message: 'Erro: Resposta inválida do servidor'
                    };
                }                // Se chegou até aqui com status 200, a alteração foi bem-sucedida
                // mesmo que o backend retorne status: false (bug conhecido)
                if (response.status === 200) {
                    console.log('✅ Alteração de senha bem-sucedida (status HTTP 200)');
                    return { 
                        success: true, 
                        status: true,
                        message: 'Senha alterada com sucesso'
                    };
                } else if (data.status) {
                    return { 
                        success: true, 
                        status: true,
                        message: data.message || 'Senha alterada com sucesso'
                    };
                } else {
                    return { 
                        success: false, 
                        status: false,
                        message: data.message || 'Erro ao alterar senha'
                    };
                }
            } catch (error) {
                console.error('❌ Erro ao alterar senha:', error);
                return { 
                    success: false, 
                    message: 'Erro de conexão'                };
            }
        },

        setPatientStatus: async function(patientId, status) {
            try {
                const adminInfo = this.getLoggedInAdminInfo();
                if (!adminInfo || !adminInfo.token) {
                    return { success: false, message: 'Usuário não autenticado' };
                }

                console.log('📋 Alterando status do paciente:', { patientId, status });

                const response = await fetch(`${API_BASE_URL}/pacientes/${patientId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminInfo.token}`
                    },
                    body: JSON.stringify({ status })
                });

                const data = await response.json();
                console.log('📡 Resposta da alteração de status:', data);

                if (response.ok && data.status) {
                    return { 
                        success: true, 
                        message: data.message || `Status do paciente alterado para ${status}`
                    };
                } else {
                    return { 
                        success: false, 
                        message: data.message || 'Erro ao alterar status do paciente'
                    };
                }
            } catch (error) {                console.error('❌ Erro ao alterar status:', error);
                return { 
                    success: false, 
                    message: 'Erro de conexão'
                };
            }
        },

        // Alias para compatibilidade com admin.js
        getConsumedFoodsByDate: async function(patientId, date) {
            console.log('📄 FRONTEND: getConsumedFoodsByDate chamado (redirecionando para getPatientFoods)');
            return this.getPatientFoods(patientId, date);
        }
    };

    // Expor o DataService globalmente
    window.AlimentaAIDataService = DataService;

})(window);
