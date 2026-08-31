const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess('');

  if (!paymentData.amount || !paymentData.email) {
    setError('Please fill in amount and email');
    setLoading(false);
    return;
  }

  try {
    console.log('📊 Sending payment request:', paymentData);

    const response = await fetch('/api/paynow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: paymentData.amount,
        email: paymentData.email,
        phone: paymentData.phone,
        description: paymentData.description,
      }),
    });

    const result = await response.json();
    console.log('📥 Payment response:', result);

    if (result.success) {
      setSuccess('Payment initiated! Redirecting to PayNow...');
      // Open PayNow in new window
      if (result.redirectUrl) {
        window.open(result.redirectUrl, '_blank');
      }
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } else {
      setError(result.error || 'Payment initiation failed');
    }
  } catch (err) {
    console.error('❌ Error:', err);
    setError('Something went wrong. Please try again.');
  }

  setLoading(false);
};
