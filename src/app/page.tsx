
'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';

// Conexión a Supabase
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
    const chatContainer = chatEndRef.current?.parentElement;
    if (!chatContainer) return;

    const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 200;
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

  const handleDrop = async (e: React.DragEvent, estado: string) => {
    const id = e.dataTransfer.getData('text/plain');
    await supabase.from('leads').update({ estado }).eq('id', id);
    const { data } = await supabase.from('leads').select('*');
    setLeads(data || []);
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: config.color_fondo || '#0f172a', color: config.color_secundario || 'white' }}>
      <div className="flex items-center justify-between p-4 shadow-md sticky top-0 z-50 bg-gray-900">
        <div className="flex items-center">
          {config.logo_url && (
            <img src={config.logo_url} alt="Logo" className="h-10 w-10 mr-4 rounded-full object-cover" />
          )}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: config.color_primario || 'white' }}>{config.titulo_crm || 'CRM'}</h1>
            <p className="text-sm" style={{ color: config.color_secundario || 'gray' }}>{config.slogan_crm || ''}</p>
          </div>
        </div>
      </div>

      {/* El resto se adapta dinámicamente */}
    </div>
  );
}
