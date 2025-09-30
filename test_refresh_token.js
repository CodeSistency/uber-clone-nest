const axios = require('axios');

const refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjksImVtYWlsIjoic3VwZXJhZG1pbkB1YmVyY2xvbmUuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwicGVybWlzc2lvbnMiOlsidXNlcnM6cmVhZCIsInVzZXJzOndyaXRlIiwidXNlcnM6ZGVsZXRlIiwidXNlcnM6c3VzcGVuZCIsInVzZXJzOnZlcmlmeSIsImRyaXZlcnM6cmVhZCIsImRyaXZlcnM6d3JpdGUiLCJkcml2ZXJzOmRlbGV0ZSIsImRyaXZlcnM6dmVyaWZ5IiwiZHJpdmVyczpzdXNwZW5kIiwicmlkZXM6cmVhZCIsInJpZGVzOndyaXRlIiwicmlkZXM6Y2FuY2VsIiwicmlkZXM6cmVhc3NpZ24iLCJyaWRlczpyZWZ1bmQiLCJhbmFseXRpY3M6cmVhZCIsInJlcG9ydHM6cmVhZCIsInJlcG9ydHM6Z2VuZXJhdGUiLCJyZXBvcnRzOmV4cG9ydCIsIm5vdGlmaWNhdGlvbnM6cmVhZCIsIm5vdGlmaWNhdGlvbnM6d3JpdGUiLCJub3RpZmljYXRpb25zOnNlbmQiLCJwcmljaW5nOnJlYWQiLCJwcmljaW5nOndyaXRlIiwiZ2VvZ3JhcGh5OnJlYWQiLCJnZW9ncmFwaHk6d3JpdGUiLCJjb25maWc6cmVhZCIsImNvbmZpZzp3cml0ZSIsInN5c3RlbTpjb25maWc6cmVhZCIsInN5c3RlbTpjb25maWc6d3JpdGUiLCJzeXN0ZW06bWFpbnRlbmFuY2UiLCJhZG1pbiIsImVtZXJnZW5jeTppbnRlcnZlbmUiLCJzYWZldHk6bW9uaXRvciJdLCJpYXQiOjE3NTkxNjg5NzEsImV4cCI6MTc1OTc3Mzc3MX0.eK7i3Sx7CCVR81JFMSEf4OlAIcBvH4_RdRDJthcUJUw";

async function testRefreshToken() {
  try {
    console.log('Testing refresh token endpoint...');
    console.log('Token length:', refreshToken.length);
    console.log('Token starts with:', refreshToken.substring(0, 50) + '...');

    const response = await axios.post('http://localhost:3000/admin/auth/refresh', {
      refreshToken: refreshToken
    });

    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.log('ERROR:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

testRefreshToken();
