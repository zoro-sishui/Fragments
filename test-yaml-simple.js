const yaml = require('yaml');
try {
  const json = '{"hello": "world"}';
  const obj = JSON.parse(json);
  const yml = yaml.stringify(obj);
  console.log('YAML conversion successful:');
  console.log(yml);
} catch (err) {
  console.error('YAML conversion failed:', err);
  process.exit(1);
}
