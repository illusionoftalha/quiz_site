const http = require('http');

http.get('http://localhost:3000/api/admin/student_details/1', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    console.log("Data:", data);
  });
}).on('error', (err) => {
  console.log("Error:", err.message);
});
