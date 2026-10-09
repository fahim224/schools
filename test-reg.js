async function testRegister() {
    try {
        const email = 'debug' + Date.now() + '@example.com';
        console.log('Registering:', email);
        const res = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Debug User',
                email: email,
                password: 'password123'
            }),
        });

        const text = await res.text();
        console.log('Status:', res.status);
        try {
            const data = JSON.parse(text);
            console.log('Response JSON:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('Response Text (not JSON):', text.substring(0, 500));
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testRegister();
