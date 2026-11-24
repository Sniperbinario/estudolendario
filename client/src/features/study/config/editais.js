import { materiasPorBloco as pfMaterias, pesos as pfPesos } from "../../../data/editalPF";
import { materiasPorBloco as inssMaterias, pesos as inssPesos } from "../../../data/editalINSS";
import { materiasPorBloco as alegoMaterias, pesos as alegoPesos } from "../../../data/editalALEGO";
import { materiasPorBloco as bbMaterias, pesos as bbPesos } from "../../../data/editalBB";
import { materiasPorBloco as silvaJardimEnfMaterias, pesos as silvaJardimEnfPesos } from "../../../data/editalSilvaJardimEnfermagem";
import { materiasPorBloco as sedesEdAsEduSocialMaterias, pesos as sedesEdAsEduSocialPesos } from "../../../data/editalSEDES_EDAS_EDUCSOCIAL";
import { materiasPorBloco as sedesTecAdmMaterias, pesos as sedesTecAdmPesos } from "../../../data/editalSEDES_TDAS_TECADM";
import { materiasPorBloco as sedesServicoSocialMaterias, pesos as sedesServicoSocialPesos } from "../../../data/editalSEDES_EDAS_SERVSOCIAL";
import { materiasPorBloco as camaraALMaterias, pesos as camaraALPesos } from "../../../data/editalCamaraAL";

export const EDITAIS = {
  pf: { materias: pfMaterias, pesos: pfPesos },
  inss: { materias: inssMaterias, pesos: inssPesos },
  alego: { materias: alegoMaterias, pesos: alegoPesos },
  camara_al: { materias: camaraALMaterias, pesos: camaraALPesos },
  sedes_tdas_tecadm: { materias: sedesTecAdmMaterias, pesos: sedesTecAdmPesos },
  sedes_edas_servsocial: { materias: sedesServicoSocialMaterias, pesos: sedesServicoSocialPesos },
  sedes_edas_educsocial: { materias: sedesEdAsEduSocialMaterias, pesos: sedesEdAsEduSocialPesos },
  bb_escriturario: { materias: bbMaterias, pesos: bbPesos },
  silva_jardim_enf: { materias: silvaJardimEnfMaterias, pesos: silvaJardimEnfPesos },
};

export const defaultEdital = EDITAIS.pf;
