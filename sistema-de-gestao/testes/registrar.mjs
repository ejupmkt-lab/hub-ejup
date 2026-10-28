// Faz o Node (a partir da 22.18, com remoção de tipos) resolver os imports sem extensão do projeto ("./secoes",
// "../dados/tipos") e o apelido "@/" como arquivos .ts, para os testes importarem o código do sistema direto.
import { register } from "node:module";
register("./resolvedor.mjs", import.meta.url);
