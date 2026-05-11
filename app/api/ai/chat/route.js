import { NextResponse } from 'next/server';
import { getAIResponse } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await getAIResponse(message, context);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI Chat API error:', error);
    return NextResponse.json(
      { error: 'Error processing AI request', response: '🤖 Perdón, tuve un error técnico. ¡Ya vuelvo!' },
      { status: 500 }
    );
  }
}
