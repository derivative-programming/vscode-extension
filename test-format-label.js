const { formatLabel } = require('./src/webviews/reports/helpers/reportDataHelper.js');

console.log('Testing formatLabel function:');
console.log('IsFKList ->', formatLabel('IsFKList'));
console.log('SqlServerDBDataType ->', formatLabel('SqlServerDBDataType'));
console.log('AppDNATestValue ->', formatLabel('AppDNATestValue'));
console.log('TestHTML5Value ->', formatLabel('TestHTML5Value'));
console.log('userIDField ->', formatLabel('userIDField'));
console.log('isAutomatic ->', formatLabel('isAutomatic'));
console.log('connectionStringName ->', formatLabel('connectionStringName'));
