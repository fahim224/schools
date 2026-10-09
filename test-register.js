async function testRegister() {
    try {
        const res = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Debug User',
                email: 'debug' + Date.now() + '@example.com',
                password: 'password123'
            }),
        });

        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Debug Info:', JSON.stringify(data.debug, null, 2));
        console.log('Error Message:', data.message);
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testRegister();
