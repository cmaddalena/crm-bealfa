// Estructura base del CRM UI con integración de Chatwoot y conexión a Supabase

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from '/workspaces/crm-bealfa/src/app/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '/workspaces/crm-bealfa/src/app/components/ui/tabs';
import { Button } from '/workspaces/crm-bealfa/src/app/components/ui/button';

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
    <div className="grid grid-cols-12 gap-4 p-4">
      {/* Sidebar - Leads */}
      <div className="col-span-3">
        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          <TabsContent value="kanban">
            {leads.map((lead: Lead) => (
              <Card
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="cursor-pointer hover:bg-gray-100 mb-2"
              >
                <CardContent>
                  <p className="font-bold">{lead.nombre || 'Sin nombre'}</p>
                  <p className="text-xs text-muted">{lead.estado || 'Nuevo'}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="dashboard">
            <Card>
              <CardContent>
                <p>Métricas del CRM (Próximamente)</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detalle Lead */}
      <div className="col-span-6">
        {selectedLead ? (
          <Card>
            <CardContent>
              <h2 className="text-xl font-bold mb-2">{selectedLead?.nombre || 'Lead seleccionado'}</h2>
              <p>Canal: {selectedLead?.canal}</p>
              <p>Teléfono: {selectedLead?.telefono}</p>
              <p>Industria: {selectedLead?.industria || 'No especificada'}</p>
              <p>Estado: {selectedLead?.estado}</p>
              <Button className="mt-4">Editar Lead</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <p>Seleccioná un lead para ver detalles.</p>
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
          className="rounded-xl shadow-lg"
        />
      </div>
    </div>
  );
}
