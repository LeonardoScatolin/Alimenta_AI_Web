// Debug script for admin dashboard food consumption issue
// Copy and paste this in the browser console when on admin.html

console.log('🔧 ADMIN DEBUG - Starting diagnostic...');

// 1. Check if all required elements exist
const elements = {
    selectPatientForFoods: document.getElementById('selectPatientForFoods'),
    foodsDate: document.getElementById('foodsDate'),
    loadFoodsBtn: document.getElementById('loadFoodsBtn'),
    foodsTableBody: document.getElementById('foodsTableBody'),
    foodsSummary: document.getElementById('foodsSummary')
};

console.log('📋 DOM Elements Check:', elements);

// 2. Check if data service is available
console.log('🔌 AlimentaAIDataService available:', typeof AlimentaAIDataService);
if (typeof AlimentaAIDataService !== 'undefined' && AlimentaAIDataService.getPatientFoods) {
    console.log('✅ getPatientFoods function available');
} else {
    console.log('❌ getPatientFoods function NOT available');
}

// 3. Check if event listeners are attached
if (elements.loadFoodsBtn) {
    console.log('🎯 Load Foods Button found, checking event listeners...');
    
    // Manually trigger the function to test
    if (typeof handleLoadFoods === 'function') {
        console.log('✅ handleLoadFoods function is available');
    } else {
        console.log('❌ handleLoadFoods function NOT available');
    }
}

// 4. Test the API call directly
async function testDirectAPICall() {
    console.log('🧪 Testing direct API call...');
    
    try {
        // Set test values
        if (elements.selectPatientForFoods) {
            // First populate the select with test option
            elements.selectPatientForFoods.innerHTML = '<option value="2">Paciente Teste</option>';
            elements.selectPatientForFoods.value = '2';
        }
        
        if (elements.foodsDate) {
            elements.foodsDate.value = '2025-06-01';
        }
        
        console.log('📝 Test values set:', {
            patientId: elements.selectPatientForFoods?.value,
            date: elements.foodsDate?.value
        });
        
        // Call the API directly
        const result = await AlimentaAIDataService.getPatientFoods('2', '2025-06-01');
        console.log('🎯 Direct API Result:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Direct API call failed:', error);
        return null;
    }
}

// 5. Test the button click event
function testButtonClick() {
    console.log('🖱️ Testing button click...');
    
    if (elements.loadFoodsBtn) {
        // Check if click event is properly attached
        const clickEvents = getEventListeners ? getEventListeners(elements.loadFoodsBtn) : 'getEventListeners not available';
        console.log('👂 Button event listeners:', clickEvents);
        
        // Simulate click
        elements.loadFoodsBtn.click();
    } else {
        console.log('❌ Load Foods Button not found');
    }
}

// 6. Check Bootstrap tab functionality
function checkTabState() {
    const foodsTab = document.getElementById('view-foods-content');
    console.log('📑 Foods tab element:', foodsTab);
    console.log('📑 Foods tab classes:', foodsTab?.className);
    console.log('📑 Foods tab display style:', foodsTab?.style.display);
    console.log('📑 Foods tab computed display:', window.getComputedStyle(foodsTab).display);
}

// Run all checks
console.log('🏃 Running all diagnostic checks...');
checkTabState();

// Instructions for manual testing
console.log(`
🔍 MANUAL TESTING INSTRUCTIONS:
1. Run: testDirectAPICall() - to test API call directly
2. Run: testButtonClick() - to test button click event
3. Navigate to "Alimentos Consumidos" tab first if not already there
4. Check network tab for any failed requests
`);

// Auto-run API test if elements are available
if (typeof AlimentaAIDataService !== 'undefined') {
    testDirectAPICall();
}
