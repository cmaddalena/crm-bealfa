
'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';

// Cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    const interval = setInterval(() => {
      if (selectedLead) fetchConversacion(selectedLead.id);
      fetchLeads();
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedLead]);

  const fetchConversacion = async (leadId: string) => {
    const { data } = await supabase
      .from('conversaciones')
      .select('*')
      .eq('lead_id', leadId)
      .order('timestamp_in', { ascending: true });
    setConversacion(data || []);
  };

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('*');
    setLeads(data || []);
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
    fetchLeads();
    setSelectedLead(null);
  };

  const handleDrop = async (e: React.DragEvent, estado: string) => {
    const id = e.dataTransfer.getData('text/plain');
    await supabase.from('leads').update({ estado }).eq('id', id);
    fetchLeads();
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
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
    fetchLeads();
    setNuevoMensaje('');
  };

  const calcularDiasUltimoMensaje = (leadId: string) => {
    const mensajes = conversacion.filter(c => c.lead_id === leadId);
    if (mensajes.length === 0) return '';
    const ultimo = mensajes[mensajes.length - 1];
    const fecha = new Date(ultimo.timestamp_in || ultimo.timestamp_out);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);
    if (diffHoras < 24) return `${Math.floor(diffHoras)}h`;
    else return `${Math.floor(diffHoras / 24)}d`;
  };

  const tieneMensajePendiente = (leadId: string) => {
    const mensajes = conversacion.filter(c => c.lead_id === leadId);
    if (mensajes.length === 0) return false;
    const ultimo = mensajes[mensajes.length - 1];
    return !!ultimo.mensaje_in && (!ultimo.mensaje_out || (ultimo.autor !== 'bot' && ultimo.autor !== 'humano'));
  };

  const camposExcluidos = ['id', 'fecha_creacion', 'usuario_update', 'fecha_update'];

  const canalColor = (canal: string) => {
    if (!canal) return 'bg-gray-600';
    if (canal.toLowerCase().includes('whatsapp')) return 'bg-green-600';
    if (canal.toLowerCase().includes('instagram')) return 'bg-pink-600';
    return 'bg-gray-600';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: config.color_fondo || '#0f172a', color: config.color_secundario || 'white' }}>
      <header className="flex items-center mb-6 p-4 bg-gray-900">
        {config.logo_url && (
          <img src={config.logo_url} alt="Logo" className="h-12 w-12 mr-4 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: config.color_primario || 'white' }}>{config.titulo_crm || 'CRM'}</h1>
          <p className="text-sm" style={{ color: config.color_secundario || 'gray' }}>{config.slogan_crm || ''}</p>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        {/* Cuerpo del CRM */}
      </main>
    </div>
  );
}
