/**
 * Helpers para generar títulos consistentes de actividad
 * Este archivo NO tiene 'use server' porque exporta objetos, no solo funciones async
 */
export const ActivityTitles = {
    // Proyectos
    projectCreated: (name: string) => `Creaste el proyecto "${name}"`,
    projectUpdated: (name: string) => `Editaste el proyecto "${name}"`,
    projectDeleted: (name: string) => `Eliminaste el proyecto "${name}"`,
    projectStatusChanged: (name: string, status: string) => `Cambiaste estado de "${name}" a ${status}`,
    projectShared: (name: string) => `Compartiste el proyecto "${name}"`,

    // Modelos
    modelCreated: (name: string) => `Añadiste talento: ${name}`,
    modelUpdated: (name: string) => `Editaste perfil de ${name}`,
    modelAddedToProject: (modelName: string, projectName: string) => `Añadiste a ${modelName} en "${projectName}"`,
    modelRemovedFromProject: (modelName: string, projectName: string) => `Removiste a ${modelName} de "${projectName}"`,

    // Selección de cliente
    clientApprovedModel: (modelName: string, projectName: string) => `Cliente aprobó a ${modelName} en "${projectName}"`,
    clientRejectedModel: (modelName: string, projectName: string) => `Cliente rechazó a ${modelName} en "${projectName}"`,

    // Clientes y marcas
    clientCreated: (name: string) => `Creaste cliente: ${name}`,
    clientUpdated: (name: string) => `Editaste cliente: ${name}`,
    brandCreated: (name: string) => `Creaste marca: ${name}`,
};
