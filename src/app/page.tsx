
'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Acá comienza el componente principal
export default function CRMApp() {
  const [leads, setLeads] = useState<any[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [conversacion, setConversacion] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [config, setConfig] = useState<any>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: estadosData } = await supabase.from('estados_crm').select('nombre_estado');
      setEstados(estadosData?.map(e => e.nombre_estado) || []);
      
      const { data: leadsData } = await supabase.from('leads').select('*');
      setLeads(leadsData || []);
      
      const { data: configData } = await supabase.from('config').select('*').single();
      setConfig(configData || {});
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedLead) {
      const interval = setInterval(() => {
        fetchConversacion(selectedLead.id);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedLead]);

  useEffect(() => {
  const container = chatEndRef.current?.parentElement;
  if (!container) return;

  const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  if (isNearBottom) {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
}, [conversacion]);

  const fetchConversacion = async (leadId: string) => {
    const { data } = await supabase
      .from('conversaciones')
      .select('*')
      .eq('lead_id', leadId)
      .order('timestamp_in', { ascending: true });
    setConversacion(data || []);
  };

  const handleSelectLead = (lead: any) => {
    setSelectedLead(lead);
    setFormData(lead);
    fetchConversacion(lead.id);
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (field === 'intervencion_humana') {
      supabase.from('leads').update({ [field]: value }).eq('id', formData.id);
    }
  };

  const handleGuardar = async () => {
    await supabase.from('leads').update(formData).eq('id', formData.id);
    setLeads(prev => prev.map(l => (l.id === formData.id ? formData : l)));
    setSelectedLead(null);
  };

  const handleSendMessage = async () => {
    if (!nuevoMensaje.trim()) return;

    await supabase.from('conversaciones').insert({
      lead_id: formData.id,
      mensaje_out: nuevoMensaje,
      tipo: 'salida',
      autor: 'humano',
      envio: 'enviado',
      timestamp_out: new Date().toISOString(),
    });

    fetchConversacion(formData.id);
    setNuevoMensaje('');
  };

  const camposExcluidos = ['id', 'fecha_creacion', 'usuario_update', 'fecha_update'];

  const canalColor = (canal: string) => {
    if (!canal) return 'bg-gray-600';
    if (canal.toLowerCase().includes('whatsapp')) return 'bg-green-600';
    if (canal.toLowerCase().includes('instagram')) return 'bg-pink-600';
    return 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      {/* Header */}
      <div className="flex items-center mb-6 sticky top-0 z-50 bg-gray-900 p-4 shadow-md">
        {config.logo_url && (
          <img src={config.logo_url} alt="Logo" className="h-12 w-12 mr-4 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{config.titulo_crm || 'CRM'}</h1>
          <p className="text-sm text-gray-400">{config.slogan_crm || ''}</p>
        </div>
      </div>

      {selectedLead ? (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 bg-gray-900 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{formData.nombre || 'Lead'}</h3>
              <button onClick={() => setSelectedLead(null)} className="text-red-500 hover:text-red-400">❌</button>
            </div>
            
            //editar lead

            <div className="grid grid-cols-2 gap-4">
            {Object.entries(formData)
              .filter(([key]) => !camposExcluidos.includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <label className="text-sm capitalize mb-1">{key}</label>
                  {key === 'intervencion_humana' ? (
                    <input
                      type="checkbox"
                      checked={value === true}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      className="self-start"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(value ?? '')}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="p-2 rounded bg-gray-800 text-white"
                    />
                  )}
                </div>
              ))}
          </div>



            <Button onClick={handleGuardar} className="w-full mt-4 bg-blue-600 rounded-full">
              Guardar
            </Button>
          </div>

          {/* Conversaciones */}
          <div className="col-span-8 flex flex-col bg-gray-900 p-4 rounded-xl">
            <h3 className="text-xl font-bold mb-4">💬 Conversación</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {conversacion.map((msg, i) => (
                <div key={i}>
                  {msg.mensaje_in && (
                    <div className="p-3 rounded-lg w-fit max-w-[80%] bg-green-700 self-start">
                      <p>{msg.mensaje_in}</p>
                      <p className="text-xs text-gray-300 mt-1 text-right">{new Date(msg.timestamp_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {new Date(msg.timestamp_in).toLocaleDateString('es-AR')}</p>
                    </div>
                  )}
                  {msg.mensaje_out && (
                    <div className={`p-3 rounded-lg w-fit max-w-[80%] ${msg.autor === 'humano' ? 'bg-blue-600' : 'bg-gray-500'} self-end ml-auto`}>
                      <p>{msg.mensaje_out}</p>
                      <p className="text-xs text-gray-300 mt-1 text-right">{new Date(msg.timestamp_out || msg.timestamp_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {new Date(msg.timestamp_out || msg.timestamp_in).toLocaleDateString('es-AR')}</p>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {formData.intervencion_humana && (
              <div className="flex gap-2 mt-4 items-center">
                <input
                  type="text"
                  placeholder="Escribí tu mensaje..."
                  className="flex-1 p-2 rounded-full bg-gray-800 text-white"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} className="bg-blue-600 rounded-full">
                  Enviar
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-4">
          {[...estados, 'Sin estado'].map((estado) => (
            <div key={estado} className="bg-gray-900 rounded-xl p-4 min-h-[300px]">
              <h3 className="text-lg font-bold mb-2">{estado}</h3>
              {leads
                .filter((lead) => lead.estado === estado || (!lead.estado && estado === 'Sin estado'))
                .map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', lead.id)}
                    onClick={() => handleSelectLead(lead)}
                    className="mb-2 p-3 bg-gray-800 cursor-pointer hover:bg-gray-700 transition rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{lead.nombre || 'Sin nombre'}</p>
                      <span className={`text-xs text-white px-2 py-1 rounded-full ${canalColor(lead.canal || '')}`}>
                        {lead.canal}
                      </span>
                    </div>
                  </Card>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
