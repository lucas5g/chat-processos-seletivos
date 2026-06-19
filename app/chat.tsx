'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Chat() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: async (input, init) => {
        const response = await fetch(input, init);

        if (response.status === 401) {
          window.location.replace('/login');
        }

        return response;
      },
    }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const requiresLogin = messages.some((message) =>
      message.parts.some((part) => toolOutputRequiresLogin(part)),
    );

    if (requiresLogin) {
      router.replace('/login');
      router.refresh();
    }
  }, [messages, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    sendMessage({ text: input });
    setInput('');
  }

  return (
    <section className="chat-shell">
      <header className="chat-header">
        <h1 className="chat-title">Processos de Estágio - DPMG</h1>
        <p className="chat-subtitle">Tire dúvidas sobre processos seletivos da Defensoria Pública de MG.</p>
      </header>

      <div className="messages">
        <div className="message-list">
          {messages.length === 0 ? (
            <div className="message-row assistant">
              <div className="message-bubble">
                <span className="message-label">Assistente</span>
                Olá! Pergunte sobre processos seletivos de estágio da DPMG
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <div className={`message-row ${message.role}`} key={message.id}>
              <div className="message-bubble">
                <span className="message-label">{message.role === 'user' ? 'Você' : 'Assistente'}</span>
                {message.parts.map((part, index) => {
                  if (part.type === 'text') {
                    return message.role === 'assistant' ? (
                      <div className="message-markdown" key={`${message.id}-${index}`}>
                        <ReactMarkdown>{part.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <span key={`${message.id}-${index}`}>{part.text}</span>
                    );
                  }

                  if (part.type.startsWith('tool-')) {
                    return (
                      <span className="tool-status" key={`${message.id}-${index}`}>
                        Consultando dados da DPMG...
                      </span>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          ))}

          {error ? (
            <div className="message-row assistant">
              <div className="message-bubble">
                <span className="message-label">Assistente</span>
                Nao foi possivel concluir a consulta. Verifique o login e tente novamente.
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Digite sua pergunta..."
          disabled={isLoading}
        />
        <button className="primary-button" type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </section>
  );
}

function toolOutputRequiresLogin(part: unknown) {
  if (!isRecord(part) || typeof part.type !== 'string' || !part.type.startsWith('tool-')) {
    return false;
  }

  if (part.state !== 'output-available' || !isRecord(part.output)) {
    return false;
  }

  return part.output.requiresLogin === true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
