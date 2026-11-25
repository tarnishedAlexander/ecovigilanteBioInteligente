import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, CheckCircle2, Bot, User, AlertCircle } from 'lucide-react';
import { ChatMessage, PendingReport } from '../types';

interface ChatGemmaScreenProps {
  onSaveReport: (report: PendingReport) => void;
  onCancel: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-1',
    sender: 'gemma',
    text: 'Hola hermano(a), soy EcoGuardián. Estoy aquí para escucharte y registrar cómo te sientes tú o tu familia en la comunidad. ¿Has sentido algún malestar físico o notas algo extraño en las aguas del río?',
    timestamp: 'Ahora'
  }
];

const SUGGESTED_PROMPTS = [
  'Comemos surubí y muturo casi todos los días en la casa.',
  'Siento temblores en las manos y se me duermen los dedos.',
  'Hay dos dragas mineras aguas arriba y el agua baja muy turbia.',
  'Todo tranquilo, solo comemos sábalo de vez en cuando.'
];

export const ChatGemmaScreen: React.FC<ChatGemmaScreenProps> = ({ onSaveReport, onCancel }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateGemmaReply = (userText: string): string => {
    const textLower = userText.toLowerCase();

    if (textLower.includes('surubi') || textLower.includes('surubí') || textLower.includes('muturo') || textLower.includes('pescado')) {
      return 'Entiendo. Esos peces de fondo como el surubí y el muturo son carnívoros y acumulan más sedimentos del río. ¿Desde hace cuánto tiempo sientes ese malestar y cada cuánto tiempo comen ese pescado en tu familia?';
    }

    if (textLower.includes('temblor') || textLower.includes('duermen') || textLower.includes('hormigueo') || textLower.includes('cabeza')) {
      return 'Comprendo lo que me dices. Ese tipo de molestia es importante de anotar para los médicos e investigadores que visitan la cuenca. ¿De dónde toman el agua para beber y cocinar en tu casa?';
    }

    if (textLower.includes('draga') || textLower.includes('balsa') || textLower.includes('turbia') || textLower.includes('mineria')) {
      return 'Es un dato muy valioso. El movimiento de las dragas remueve el fondo del río y suele generar arrastre de sedimentos aguas abajo. ¿Has visto también peces flotando o plantas dañadas cerca de la orilla?';
    }

    return 'Gracias por compartirlo. He tomado nota de tus palabras para que el equipo científico pueda contrastar estos datos con las muestras de la cuenca. Puedes presionar "Guardar Reporte" cuando desees concluir.';
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: 'Ahora'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate Gemma 2B on-device streaming inference
    setTimeout(() => {
      const gemmaMsg: ChatMessage = {
        id: `g-${Date.now()}`,
        sender: 'gemma',
        text: generateGemmaReply(text),
        timestamp: 'Ahora'
      };
      setMessages((prev) => [...prev, gemmaMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleFinishAndSave = () => {
    // Compile full dialogue into transcription for backend Gemma extraction
    const transcript = messages
      .map((m) => `${m.sender === 'user' ? 'Comunario' : 'Asistente'}: ${m.text}`)
      .join('\n');

    const newReport: PendingReport = {
      id: `local-chat-${Date.now()}`,
      latitud: -11.0210,
      longitud: -66.0790,
      categoria: 'salud',
      descripcion_usuario: 'Entrevista de salud comunitaria guiada por asistente Gemma 2B',
      url_foto: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
      comunidad_nombre: 'Riberalta',
      transcripcion_chat: transcript,
      fecha_local: new Date().toISOString(),
      sincronizado: false
    };

    onSaveReport(newReport);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-[#021813] to-[#010e0b] overflow-hidden">
      {/* Gemma Local AI Badge */}
      <div className="px-4 py-2 bg-emerald-950/60 border-b border-emerald-900/40 flex items-center justify-between text-[11px] text-emerald-300">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Gemma 2B Local (Edge AI)</span>
        </div>
        <span className="text-[10px] text-emerald-400/80 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-700/40">
          🔒 100% Privado y Seguro
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const isGemma = m.sender === 'gemma';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${isGemma ? 'justify-start' : 'justify-end'}`}
            >
              {isGemma && (
                <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
              )}

              <div
                className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed shadow-md ${
                  isGemma
                    ? 'bg-gradient-to-br from-emerald-950/80 to-[#042d22] border border-emerald-800/50 text-slate-100 rounded-tl-none'
                    : 'bg-emerald-600 text-white rounded-tr-none font-medium'
                }`}
              >
                {m.text}
              </div>

              {!isGemma && (
                <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-emerald-400 text-xs pl-9">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
            <span className="text-[10px] text-emerald-300">Gemma analizando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Pills */}
      <div className="px-3 py-1.5 overflow-x-auto flex gap-1.5 bg-[#01140f] border-t border-emerald-950">
        {SUGGESTED_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 rounded-full bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 text-[10px] text-emerald-300 whitespace-nowrap transition-colors"
          >
            💬 {p}
          </button>
        ))}
      </div>

      {/* Input Bar and Action Buttons */}
      <div className="p-3 bg-[#021813] border-t border-emerald-900/60 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu respuesta aquí..."
            className="flex-1 bg-black/40 border border-emerald-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-all shadow-md shadow-emerald-950/50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Finalize button */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-xs rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
          >
            Volver
          </button>

          <button
            onClick={handleFinishAndSave}
            className="flex-2 py-2 px-3 text-xs rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/60"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalizar y Guardar Reporte</span>
          </button>
        </div>
      </div>
    </div>
  );
};
