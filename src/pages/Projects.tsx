import React from 'react';
import { Card } from '../components/Components';

export const Projects: React.FC = () => {
  return (
    <div className="p-4 pb-24">
      <Card className="p-4 text-sm text-slate-500">
        Módulo de <strong>proyectos generales</strong> en construcción. <br />
        Para viajes usa la pestaña <strong>Viajes</strong> de abajo 👇
      </Card>
    </div>
  );
};

export default Projects;
