// Estructura base del CRM UI con integración de Chatwoot y conexión a Supabase

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from './components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Button } from './components/ui/button';

interface Lead {
  id: string;
  nombre?: string;
  canal?: string;
  telefono?: string;
  industria?: string;
  estado?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CRMApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      if (!error && data) setLeads(data as Lead[]);
    };
    fetchLeads();
  }, []);

  return (
    <div className="grid grid-cols-12 gap-6 px-6 py-8 bg-neutral-900 min-h-screen text-white">
      {/* Sidebar - Leads */}
      <div className="col-span-3">
        <Tabs defaultValue="kanban">
          <div className="flex gap-2 mb-4">
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="kanban">
            {leads.map((lead: Lead) => (
              <Card
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="cursor-pointer hover:bg-neutral-800 mb-2 shadow-md p-2 border border-gray-700"
              >
                <CardContent>
                  <p className="font-semibold text-lg">{lead.nombre || 'Sin nombre'}</p>
                  <p className="text-sm text-gray-400">{lead.estado || 'Nuevo'}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="dashboard">
            <div className="shadow-md bg-neutral-800 border border-gray-700 rounded-xl">
              <Card>
                <CardContent>
                  <p className="text-gray-400">📊 Métricas del CRM (Próximamente)</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detalle Lead */}
      <div className="col-span-6">
        {selectedLead ? (
          <Card className="shadow-md bg-neutral-800 border border-gray-700">
            <CardContent>
              <h2 className="text-2xl font-bold mb-4">{selectedLead?.nombre || 'Lead seleccionado'}</h2>
              <p className="mb-1">📱 <strong>Canal:</strong> {selectedLead?.canal}</p>
              <p className="mb-1">📞 <strong>Teléfono:</strong> {selectedLead?.telefono}</p>
              <p className="mb-1">🏢 <strong>Industria:</strong> {selectedLead?.industria || 'No especificada'}</p>
              <p className="mb-4">📌 <strong>Estado:</strong> {selectedLead?.estado}</p>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white">Editar Lead</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md bg-neutral-800 border border-gray-700">
            <CardContent>
              <p className="text-gray-400">Seleccioná un lead para ver detalles.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chatwoot embebido */}
      <div className="col-span-3">
        <iframe
          src="https://tu-chatwoot.com/app/accounts/1/inbox"
          width="100%"
          height="800px"
          frameBorder="0"
          className="rounded-xl shadow-xl border border-gray-700"
        />
      </div>
    </div>
  );
}
