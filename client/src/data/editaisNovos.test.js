import test from "node:test";
import assert from "node:assert/strict";
import { materiasPorBloco as cofen, pesos as cofenPesos } from "./editalCofenAnalistaTecnico.js";
import { materiasPorBloco as receita, pesos as receitaPesos } from "./editalReceitaAuditor.js";

const nomes = (edital) => Object.values(edital).flat().map((materia) => materia.nome);
const totalTopicos = (edital) => Object.values(edital).flat().reduce((total, materia) => total + materia.topicos.length, 0);
const somaPesos = (pesos) => Object.values(pesos).reduce((total, peso) => total + peso, 0);

test("Cofen Analista Técnico contém todas as áreas do edital", () => {
  assert.deepEqual(nomes(cofen), [
    "Língua Portuguesa",
    "Raciocínio Lógico e Matemática",
    "Noções de Informática",
    "Legislação Específica",
    "Noções de Direito Constitucional - Complementares",
    "Noções de Direito Administrativo - Complementares",
    "Noções de Direito Constitucional - Específicos",
    "Noções de Direito Administrativo - Específicos",
    "Noções de Administração Pública",
    "Contratos Administrativos",
    "Gestão de Contratos",
    "Gestão de Projetos",
    "Organização e Controle de Documentos",
    "Legislação e Ética na Administração Pública",
  ]);
  assert.equal(totalTopicos(cofen), 91);
  assert.equal(somaPesos(cofenPesos), 1);
});

test("Receita Federal Auditor-Fiscal contém as 17 disciplinas", () => {
  assert.deepEqual(nomes(receita), [
    "Língua Portuguesa",
    "Língua Inglesa",
    "Raciocínio Lógico-Matemático",
    "Estatística",
    "Economia e Finanças Públicas",
    "Administração Geral",
    "Administração Pública",
    "Auditoria",
    "Contabilidade Geral e Pública",
    "Fluência em Dados",
    "Direito Administrativo",
    "Direito Constitucional",
    "Direito Previdenciário",
    "Direito Tributário",
    "Legislação Tributária",
    "Comércio Internacional",
    "Legislação Aduaneira",
  ]);
  assert.equal(totalTopicos(receita), 302);
  assert.equal(somaPesos(receitaPesos), 1);
});
