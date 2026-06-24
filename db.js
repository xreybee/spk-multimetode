/* C:\Users\Reyhan\Documents\spk\db.js */

async function db_saveProject(uid, projectData) {
    const project = {
        uid: uid,
        name: projectData.name || "Evaluasi Tanpa Nama",
        activeMethod: projectData.activeMethod || "saw",
        weightScale: projectData.weightScale || "0-1",
        createdAt: projectData.createdAt || new Date().toISOString(),
        criteria: projectData.criteria || [],
        alternatives: projectData.alternatives || [],
        directRatings: projectData.directRatings || [],
        criteriaPairwise: projectData.criteriaPairwise || [],
        alternativesPairwise: projectData.alternativesPairwise || [],
        status: projectData.status || "active" // active | archived
    };

    if (window.useFirebase) {
        try {
            // Firestore doesn't support nested arrays, so serialize them to JSON strings
            const firebaseProject = {
                ...project,
                directRatings: JSON.stringify(project.directRatings),
                criteriaPairwise: JSON.stringify(project.criteriaPairwise),
                alternativesPairwise: JSON.stringify(project.alternativesPairwise)
            };

            // If the project has an ID, update it; otherwise add new
            if (projectData.id) {
                await window.db.collection('projects').doc(projectData.id).set(firebaseProject, { merge: true });
                return { success: true, id: projectData.id };
            } else {
                // If setting new project to active, archive any currently active projects first
                if (project.status === "active") {
                    await db_archiveAllActive(uid);
                }
                const docRef = await window.db.collection('projects').add(firebaseProject);
                return { success: true, id: docRef.id };
            }
        } catch (error) {
            console.error("Firebase db_saveProject error:", error);
            return { success: false, error: error.message };
        }
    } else {
        // Localstorage mock
        let projects = JSON.parse(localStorage.getItem('spk_projects') || '[]');
        
        if (projectData.id) {
            const idx = projects.findIndex(p => p.id === projectData.id && p.uid === uid);
            if (idx !== -1) {
                projects[idx] = { ...projects[idx], ...project };
                localStorage.setItem('spk_projects', JSON.stringify(projects));
                return { success: true, id: projectData.id };
            }
        } else {
            if (project.status === "active") {
                // Archive others
                projects = projects.map(p => p.uid === uid && p.status === "active" ? { ...p, status: "archived" } : p);
            }
            const newId = 'proj_' + Date.now();
            projects.push({
                id: newId,
                ...project
            });
            localStorage.setItem('spk_projects', JSON.stringify(projects));
            return { success: true, id: newId };
        }
        return { success: false, error: "Project not found" };
    }
}

async function db_archiveAllActive(uid) {
    if (window.useFirebase) {
        const querySnapshot = await window.db.collection('projects')
            .where('uid', '==', uid)
            .where('status', '==', 'active')
            .get();
        const batch = window.db.batch();
        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { status: 'archived' });
        });
        await batch.commit();
    } else {
        let projects = JSON.parse(localStorage.getItem('spk_projects') || '[]');
        projects = projects.map(p => p.uid === uid && p.status === "active" ? { ...p, status: "archived" } : p);
        localStorage.setItem('spk_projects', JSON.stringify(projects));
    }
}

async function db_getActiveProject(uid) {
    if (window.useFirebase) {
        try {
            const querySnapshot = await window.db.collection('projects')
                .where('uid', '==', uid)
                .where('status', '==', 'active')
                .limit(1)
                .get();
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    directRatings: typeof data.directRatings === 'string' ? JSON.parse(data.directRatings) : (data.directRatings || []),
                    criteriaPairwise: typeof data.criteriaPairwise === 'string' ? JSON.parse(data.criteriaPairwise) : (data.criteriaPairwise || []),
                    alternativesPairwise: typeof data.alternativesPairwise === 'string' ? JSON.parse(data.alternativesPairwise) : (data.alternativesPairwise || [])
                };
            }
            return null;
        } catch (error) {
            console.error("Firebase db_getActiveProject error:", error);
            return null;
        }
    } else {
        const projects = JSON.parse(localStorage.getItem('spk_projects') || '[]');
        const active = projects.find(p => p.uid === uid && p.status === "active");
        return active || null;
    }
}

async function db_getArchivedProjects(uid) {
    if (window.useFirebase) {
        try {
            const querySnapshot = await window.db.collection('projects')
                .where('uid', '==', uid)
                .where('status', '==', 'archived')
                .get();
            const list = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                list.push({ 
                    id: doc.id, 
                    ...data,
                    directRatings: typeof data.directRatings === 'string' ? JSON.parse(data.directRatings) : (data.directRatings || []),
                    criteriaPairwise: typeof data.criteriaPairwise === 'string' ? JSON.parse(data.criteriaPairwise) : (data.criteriaPairwise || []),
                    alternativesPairwise: typeof data.alternativesPairwise === 'string' ? JSON.parse(data.alternativesPairwise) : (data.alternativesPairwise || [])
                });
            });
            // Sort in memory to avoid composite index requirement in Firestore
            list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            return list;
        } catch (error) {
            console.error("Firebase db_getArchivedProjects error:", error);
            return [];
        }
    } else {
        const projects = JSON.parse(localStorage.getItem('spk_projects') || '[]');
        return projects
            .filter(p => p.uid === uid && p.status === "archived")
            .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
}

async function db_setProjectActive(uid, projectId) {
    if (window.useFirebase) {
        try {
            // First archive all active projects
            await db_archiveAllActive(uid);
            // Set this one to active
            await window.db.collection('projects').doc(projectId).update({ status: 'active' });
            return { success: true };
        } catch (error) {
            console.error("Firebase db_setProjectActive error:", error);
            return { success: false, error: error.message };
        }
    } else {
        let projects = JSON.parse(localStorage.getItem('spk_projects') || '[]');
        projects = projects.map(p => {
            if (p.uid === uid) {
                if (p.id === projectId) {
                    return { ...p, status: "active" };
                } else if (p.status === "active") {
                    return { ...p, status: "archived" };
                }
            }
            return p;
        });
        localStorage.setItem('spk_projects', JSON.stringify(projects));
        return { success: true };
    }
}

async function db_deleteProject(uid, projectId) {
    if (window.useFirebase) {
        try {
            await window.db.collection('projects').doc(projectId).delete();
            return { success: true };
        } catch (error) {
            console.error("Firebase db_deleteProject error:", error);
            return { success: false, error: error.message };
        }
    } else {
        let projects = JSON.parse(localStorage.getItem('spk_projects') || '[]');
        projects = projects.filter(p => !(p.uid === uid && p.id === projectId));
        localStorage.setItem('spk_projects', JSON.stringify(projects));
        return { success: true };
    }
}
