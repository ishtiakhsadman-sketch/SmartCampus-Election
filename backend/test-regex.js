const title = 'Vice President (VP)';
const replaced = title.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
console.log('Replaced:', replaced);
const regexPattern = new RegExp('^\\s*' + replaced + '\\s*$', 'i');
console.log('Regex:', regexPattern);
