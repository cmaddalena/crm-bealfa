'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card } from './components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Button } from './components/ui/button';

interface Lead {
  id: string;
  nombre?: string;
  canal?: string;
  telefono?: string;
  industria?: string;
  estado?: string;
  usuario_instagram?: string;
  personalidad?: string;
  facturacion?: string;
  tamaño_negocio?: string;
  dolor_principal?: string;
  origen?: string;
  referido_id?: string;
  notas?: string;
  tipo_cliente?: 'A' | 'B' | 'C';
  fecha_update?: string;
  usuario_update?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CRMApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      if (data) setLeads(data as Lead[]);
    };
    fetchLeads();
  }, []);

  const handleInputChange = (field: keyof Lead, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedLead) return;
    const updateData = {
      ...formData,
      fecha_update: new Date().toISOString(),
      usuario_update: 'CRM',
    };
    const { error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', selectedLead.id);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setIsEditing(false);
      setSelectedLead({ ...selectedLead, ...updateData });
    }
  };

  const getChannelIcon = (canal: string | undefined) => {
    if (!canal) return null;
    if (canal.toLowerCase() === 'whatsapp') return '📱';
    if (canal.toLowerCase() === 'instagram') return '📸';
    return '🌐';
  };

  const getColorClass = (tipo: string | undefined) => {
    if (tipo === 'A') return 'bg-green-600';
    if (tipo === 'B') return 'bg-yellow-500';
    if (tipo === 'C') return 'bg-red-600';
    return 'bg-gray-700';
  };

  return (
    <div className="grid grid-cols-12 gap-6 px-6 py-8 bg-gray-950 min-h-screen text-white font-sans">
      {/* Sidebar - Leads */}
      <div className="col-span-3">
        <Tabs defaultValue="kanban">
          <div className="flex gap-2 mb-4">
            <div className="w-full justify-between bg-gray-800 p-1 rounded-xl flex">
              <TabsTrigger value="kanban" className="w-full">Kanban</TabsTrigger>
              <TabsTrigger value="dashboard" className="w-full">Dashboard</TabsTrigger>
            </div>
          </div>
          <TabsContent value="kanban">
            {leads.map((lead: Lead) => (
              <Card
                key={lead.id}
                onClick={() => {
                  setSelectedLead(lead);
                  setFormData({});
                  setIsEditing(false);
                }}
                className="cursor-pointer hover:bg-gray-800 mb-2 transition-colors duration-150 border border-gray-700 rounded-xl shadow-sm"
              >
                <div className="p-4">
                  <p className="font-semibold text-base flex items-center gap-2">
                    {getChannelIcon(lead.canal)} {lead.nombre || 'Sin nombre'}
                  </p>
                  <p className="text-sm text-gray-400">{lead.estado || 'Nuevo'}</p>
                </div>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="dashboard">
            <Card className="bg-gray-900 border border-gray-700 rounded-xl">
              <div className="p-6">
                <p className="text-gray-400">📊 Métricas del CRM (Próximamente)</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Panel Detalle Lead */}
      <div className="col-span-6">
        {selectedLead && !isEditing ? (
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedLead?.nombre || 'Lead seleccionado'}</h2>
              <p className="mb-2">📱 <strong>Canal:</strong> {selectedLead?.canal}</p>
              <p className="mb-2">📞 <strong>Teléfono:</strong> {selectedLead?.telefono}</p>
              <p className="mb-2">🏢 <strong>Industria:</strong> {selectedLead?.industria}</p>
              <p className="mb-2">🧠 <strong>Personalidad:</strong> {selectedLead?.personalidad}</p>
              <p className="mb-2">💸 <strong>Facturación:</strong> {selectedLead?.facturacion}</p>
              <p className="mb-2">👥 <strong>Tamaño Negocio:</strong> {selectedLead?.tamaño_negocio}</p>
              <p className="mb-2">🔥 <strong>Dolor Principal:</strong> {selectedLead?.dolor_principal}</p>
              <p className="mb-2">📍 <strong>Origen:</strong> {selectedLead?.origen}</p>
              <p className="mb-2">🧾 <strong>Notas:</strong> {selectedLead?.notas}</p>
              <p className="mb-2">🧩 <strong>Tipo Cliente:</strong> <span className={`px-2 py-1 rounded ${getColorClass(selectedLead?.tipo_cliente)}`}>{selectedLead?.tipo_cliente || 'Sin definir'}</span></p>
              <p className="mb-6">📌 <strong>Estado:</strong> {selectedLead?.estado}</p>
              <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-500 text-white">Editar Lead</Button>
            </div>
          </Card>
        ) : selectedLead && isEditing ? (
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-md relative">
            <div className="p-6 space-y-4">
              {/* Botón cerrar */}
              <button className="absolute right-4 top-4 text-xl" onClick={() => setIsEditing(false)}>❌</button>
              {[
                'nombre', 'telefono', 'industria', 'personalidad', 'facturacion',
                'tamaño_negocio', 'dolor_principal', 'origen', 'estado', 'notas'
              ].map((field) => (
                <input
                  key={field}
                  type="text"
                  defaultValue={(selectedLead as any)[field] || ''}
                  placeholder={field}
                  onChange={(e) => handleInputChange(field as keyof Lead, e.target.value)}
                  className="w-full p-2 rounded bg-gray-800 text-white"
                />
              ))}
              {/* Tipo cliente A B C */}
              <div className="flex gap-2">
                {['A', 'B', 'C'].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => handleInputChange('tipo_cliente', tipo)}
                    className={`px-3 py-1 rounded ${getColorClass(tipo)} ${formData.tipo_cliente === tipo ? 'ring-2 ring-white' : ''}`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>

              {/* Botones acción */}
              <div className="flex gap-3 mt-4">
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-500">Guardar</Button>
                <Button onClick={() => setIsEditing(false)} className="bg-gray-600 hover:bg-gray-500">Cancelar</Button>
              </div>
              <div className="mt-2 text-green-400">{saveSuccess && '✅ Cambios guardados con éxito'}</div>
              <div className="text-center mt-8">
                <button className="text-gray-400 underline" onClick={() => setIsEditing(false)}>← Volver</button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-md">
            <div className="p-6 text-gray-400 text-center">
              <p className="text-lg">👈 Seleccioná un lead desde la izquierda para ver detalles.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Tercer panel (reservado para conversación o info extra) */}
      <div className="col-span-3">
        <Card className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-gray-400 text-center">
          <p>🧠 Aquí va el historial o conversación.</p>
        </Card>
      </div>
    </div>
  );
}
