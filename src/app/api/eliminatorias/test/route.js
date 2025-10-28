export async function POST(request) {
  try {
    const { torneioId } = await request.json();
    
    console.log('=== TEST API CALL ===');
    console.log('TorneioId received:', torneioId);
    
    return Response.json({ 
      message: 'Test successful', 
      torneioId: torneioId 
    });
    
  } catch (error) {
    console.error('Test API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
