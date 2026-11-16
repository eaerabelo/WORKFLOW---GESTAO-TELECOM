// C:\PAINEL CLARO\painel-claro\BACKEND\src\scripts\seed_colaboradores.js
import { getOracleConnection, closeOraclePool } from '../config/oracle.js';

export const RAW_COLABORADORES = [
  // === ADM (50) ===
  { nome: "PRISCILA SANCHES DOS SANTOS", cargo: "ADM", numero: "11 99409-1992" },
  { nome: "NATHAN CAMELO GOMES DA SILVA", cargo: "ADM", numero: "11 97984-6154" },
  { nome: "GISELE RODRIGUES", cargo: "ADM", numero: "11 98037-6364" },
  { nome: "JULIANA FUENTES", cargo: "ADM", numero: "11 94245-2515" },
  { nome: "ISABELA CARDOSO DA SILVA", cargo: "ADM", numero: "11 95889-2174" },
  { nome: "AUDREY STEFANY COLANO DA SILVA", cargo: "ADM", numero: "11 98887-5735" },
  { nome: "SILVANA DA ROCHA FERREIRA", cargo: "ADM", numero: "11 99304-1054" },
  { nome: "GISELE CRISTINA RIBAS GOMES", cargo: "ADM", numero: "11 98845-5059" },
  { nome: "DANIELA GONCALVES DE OLIVEIRA", cargo: "ADM", numero: "11 95340-9883" },
  { nome: "HILANA CAROLINA FERREIRA DE ARAUJO", cargo: "ADM", numero: "11 96294-6854" },
  { nome: "KIMBERLY PAVAO DA SILVA", cargo: "ADM", numero: "11 98785-8950" },
  { nome: "SIMONE NERIS DE OLIVEIRA", cargo: "ADM", numero: "11 94741-0726" },
  { nome: "ERICA NASCIMENTO SILVA", cargo: "ADM", numero: "11 98969-7666" },
  { nome: "NAIRAN GLEIDE ARAUJO DA SILVA", cargo: "ADM", numero: "11 94542-5111" },
  { nome: "BRUNA MANUELE DOS SANTOS MACENA", cargo: "ADM", numero: "11 96838-9842" },
  { nome: "VITORIA REGINA BELLO RIBEIRO", cargo: "ADM", numero: "11 94036-7604" },
  { nome: "MILENA VICTORIA DE SOUZA DIAS", cargo: "ADM", numero: "11 97684-5894" },
  { nome: "GUSTAVO MENDES KUNIOSHI", cargo: "ADM", numero: "11 99334-5084" },
  { nome: "ALISSON MIRANDA ALVES MACHADO", cargo: "ADM", numero: "11 99802-6191" },
  { nome: "GABRIEL LUNA SILVA CEZAR", cargo: "ADM", numero: "11 96615-4192" },
  { nome: "VICTORIA MARTINS SILVA", cargo: "ADM", numero: "11 99453-0100" },
  { nome: "JULIANA NASCIMENTO MELO", cargo: "ADM", numero: "11 96624-4180" },
  { nome: "NATHALIA STEPHANIE DA SILVA", cargo: "ADM", numero: "15 99728-2680" },
  { nome: "SABRINA DE OLIVEIRA DUARTE", cargo: "ADM", numero: "11 97086-3091" },
  { nome: "ELISA BEATRIZ COSTA DE CARVALHO", cargo: "ADM", numero: "11 97365-3288" },
  { nome: "CESAR ALEX VIGETA DOS SANTOS", cargo: "ADM", numero: "11 99299-3012" },
  { nome: "GABRIELA DA SILVA DIAS", cargo: "ADM", numero: "11 94709-9223" },
  { nome: "SIMONIA APARECIDA MOREIRA PUGLIESE", cargo: "ADM", numero: "11 96684-3934" },
  { nome: "TAMARA ARAMAYO DA SILVA", cargo: "ADM", numero: "11 95114-8624" },
  { nome: "CATIA DA SILVA MIRANDA", cargo: "ADM", numero: "11 94786-9780" },
  { nome: "ALEXIA GARCIA DE FRANCA", cargo: "ADM", numero: "11 98157-0677" },
  { nome: "SABRINA DUTRA DOS SANTOS", cargo: "ADM", numero: "11 97669-5012" },
  { nome: "JULIANA LIMA", cargo: "ADM", numero: "11 99124-7400" },
  { nome: "NADIA APARECIDA (Afastada)", cargo: "ADM", numero: "11 99477-6261" },
  { nome: "KAROLINE LOURENÇO DE OLIVEIRA", cargo: "ADM", numero: "11 97360-1851" },
  { nome: "DANIELE INACIO DE SOUZA", cargo: "ADM", numero: "11 97991-9129" },
  { nome: "THAIS DA SILVA LOPES TARANTA", cargo: "ADM", numero: "11 96914-5220" },
  { nome: "JOAO PEDRO FERREIRA DE AGUIAR", cargo: "ADM", numero: "11 99359-7097" },
  { nome: "LAIS VIVIANE MARTINS DE SOUZA SANTOS", cargo: "ADM", numero: "11 95368-2876" },
  { nome: "NATALIA ALVES", cargo: "ADM", numero: "11 98237-2182" },
  { nome: "MARIA HELENA CARVALHO DOS SANTOS", cargo: "ADM", numero: "11 95393-4141" },
  { nome: "LARISSA MARTINS GLASSER", cargo: "ADM", numero: "11 99252-5249" },
  { nome: "ANA PAULA ROMEU GOMES", cargo: "ADM", numero: "11 97649-1999" },
  { nome: "EMANUELE DEIZE GONCALVES SILVA", cargo: "ADM", numero: "11 98969-0000" },
  { nome: "ANNA BEATRIZ DOS SANTOS", cargo: "ADM", numero: "11 99478-2850" },
  { nome: "RAFAELA ELIFAZ DA SILVA", cargo: "ADM", numero: "11 97510-7176" },
  { nome: "DANIELA ANTONANGELO DA CUNHA", cargo: "ADM", numero: "11 99848-1103" },
  { nome: "ELLEN CRISTINA APARECIDA DANTAS DE SA", cargo: "ADM", numero: "11 97666-3435" },
  { nome: "TAINNA MACHADO TERRA", cargo: "ADM", numero: "11 98847-9044" },
  { nome: "ADRIELE GERMANO OLIVEIRA", cargo: "ADM", numero: "11 94071-4725" },

  // === GERENTE (48) ===
  { nome: "CLAYTON BERNARDO RODRIGUES DOS SANTOS", cargo: "GERENTE", numero: "11 98944-8070" },
  { nome: "STEPHANIE ANTONIA RIBEIRO MOREIRA DOS SANTOS", cargo: "GERENTE", numero: "11 99797-7730" },
  { nome: "DENIZE SILVA DE ANDRADE", cargo: "GERENTE", numero: "11 95947-7129" },
  { nome: "SOLANGE ALVES DA SILVA", cargo: "GERENTE", numero: "11 96590-7827" },
  { nome: "CARLOS ERIVANDO MARTINS DE SOUSA", cargo: "GERENTE", numero: "11 94010-1133" },
  { nome: "KATIA LOPES SILVA CRUZ", cargo: "GERENTE", numero: "11 99192-5204" },
  { nome: "PRISCILA CRISTINA DE SOUZA", cargo: "GERENTE", numero: "11 94003-5616" },
  { nome: "GESSICA TAMARA DA SILVA", cargo: "GERENTE", numero: "11 98926-4741" },
  { nome: "DANIEL ZANETTI CARACA", cargo: "GERENTE", numero: "11 98797-8162" },
  { nome: "LUIZ CARLOS DE SOUZA BISPO", cargo: "GERENTE", numero: "11 99218-8665" },
  { nome: "GABRIELA DIAS NUNES GOIS", cargo: "GERENTE", numero: "11 94420-9020" },
  { nome: "PATRICIA HELENA LINS DA SILVA", cargo: "GERENTE", numero: "11 97672-4406" },
  { nome: "LORRAYNE GABRIELE MAGALHAES", cargo: "GERENTE", numero: "11 98831-7138" },
  { nome: "ROBSON BASILIO DE OLIVEIRA", cargo: "GERENTE", numero: "11 99309-8280" },
  { nome: "RUDNEY ARAUJO DE OLIVEIRA", cargo: "GERENTE", numero: "11 99583-2248" },
  { nome: "ROBERTA PICOLO CORACCINI", cargo: "GERENTE", numero: "11 99409-5136" },
  { nome: "ROSANGELA GOMES CERQUEIRA SILVA", cargo: "GERENTE", numero: "11 99292-6048" },
  { nome: "ROGERIO LUIZ PEREIRA", cargo: "GERENTE", numero: "11 98589-2215" },
  { nome: "THELMA BIANCA DE GODOY DO NASCIMENTO", cargo: "GERENTE", numero: "11 97663-2647" },
  { nome: "FELIPE GARCIA NASCIMENTO", cargo: "GERENTE", numero: "11 99495-9595" },
  { nome: "GLAUCIA KARINA DE SOUZA", cargo: "GERENTE", numero: "11 99108-8888" },
  { nome: "DANIELLE FREITAS DA SILVA", cargo: "GERENTE", numero: "11 94071-8149" },
  { nome: "VANIA BATISTA DE SOUZA SOARES", cargo: "GERENTE", numero: "11 97666-6969" },
  { nome: "PATRICIA GOMES CORDEIRO SILVA", cargo: "GERENTE", numero: "11 99284-9779" },
  { nome: "TAMARA GOMES BARBOSA", cargo: "GERENTE", numero: "11 98808-6330" },
  { nome: "DANIELE SILVA RIBEIRO", cargo: "GERENTE", numero: "11 99293-3759" },
  { nome: "MARCIO DIAS DA SILVA", cargo: "GERENTE", numero: "11 94733-3497" },
  { nome: "GABRIELA BONFIM MENEZES DA SILVA", cargo: "GERENTE", numero: "11 94718-4784" },
  { nome: "RUBENS PIOVESAN JAYME", cargo: "GERENTE", numero: "11 94932-3147" },
  { nome: "FABIO GUILHERME DOS SANTOS", cargo: "GERENTE", numero: "11 96582-3978" },
  { nome: "AMANDA PAMELA DA FONTE SARMENTO", cargo: "GERENTE", numero: "11 94079-4598" },
  { nome: "JULIANA TIAGO ROGERIO", cargo: "GERENTE", numero: "11 94596-7440" },
  { nome: "ANDREZA VIEIRA DOS SANTOS", cargo: "GERENTE", numero: "11 96224-9608" },
  { nome: "RAFAEL ASSUNCAO RAIMUNDO", cargo: "GERENTE", numero: "11 98889-7383" },
  { nome: "EDUARDO ARVANI BINS", cargo: "GERENTE", numero: "11 99945-8842" },
  { nome: "DANIELA DAMICO CAMPOZANA", cargo: "GERENTE", numero: "11 99266-9995" },
  { nome: "DAIANDRA CAROLINE LOURENCO PICOLINI", cargo: "GERENTE", numero: "11 99494-7505" },
  { nome: "VICTOR HUGO DIAS PAIVA", cargo: "GERENTE", numero: "11 97666-1846" },
  { nome: "MARCUS VINICIUS ROBERTO (Afastado)", cargo: "GERENTE", numero: "11 99906-9753" },
  { nome: "RAPHAEL AUGUSTO MORENO DE CAMPOS", cargo: "GERENTE", numero: "11 98989-8039" },
  { nome: "EVALDO LIMA SOUZA", cargo: "GERENTE", numero: "11 99122-2444" },
  { nome: "ADALIANA FERNANDES MOTA", cargo: "GERENTE", numero: "11 94026-6902" },
  { nome: "ISMAEL PEREIRA DA SILVA", cargo: "GERENTE", numero: "11 99180-8080" },
  { nome: "FELIPE PRECIOZO BERALDO", cargo: "GERENTE", numero: "11 94005-6623" },
  { nome: "LUAN SILVA SANTOS", cargo: "GERENTE", numero: "19 99418-4051" },
  { nome: "LUZIDETE APARECIDA PEREIRA", cargo: "GERENTE", numero: "11 99162-7236" },
  { nome: "THAIS ARAUJO DE ANDRADE", cargo: "GERENTE", numero: "11 94024-4750" },
  { nome: "HEMILY LOIANE ALVES MONTEIRO", cargo: "GERENTE", numero: "11 94749-7572" },

  // === SENIOR (103) ===
  { nome: "VITOR DE GODOI SANTOS", cargo: "SENIOR", numero: "11 96899-7065" },
  { nome: "LARISSA BATISTA", cargo: "SENIOR", numero: "11 96776-6211" },
  { nome: "RODRIGO PIRES LAURINDO", cargo: "SENIOR", numero: "11 94028-8574" },
  { nome: "LEONARDO DA SILVA LOURENCO", cargo: "SENIOR", numero: "11 94591-6004" },
  { nome: "SERGIO DA CONCEICAO CARNEIRO DIAS", cargo: "SENIOR", numero: "11 97737-4741" },
  { nome: "EDUARDO CESAR GOMES DE PAIVA", cargo: "SENIOR", numero: "11 99449-1234" },
  { nome: "PALOMA BANDEIRA", cargo: "SENIOR", numero: "11 98790-5225" },
  { nome: "RAFAELA LIMA SANTOS", cargo: "SENIOR", numero: "11 91373-6090" },
  { nome: "THAIS MARIA DA SILVA DOS SANTOS", cargo: "SENIOR", numero: "11 93931-1378" },
  { nome: "BARBBARA FRANCA", cargo: "SENIOR", numero: "11 94542-8996" },
  { nome: "NATÁLIA DE LIMA PERES", cargo: "SENIOR", numero: "11 95701-0758" },
  { nome: "ELIANE SENA DE SANTANA", cargo: "SENIOR", numero: "11 96624-4669" },
  { nome: "TIAGO MARQUES", cargo: "SENIOR", numero: "11 96576-5003" },
  { nome: "RAQUEL MANSON", cargo: "SENIOR", numero: "11 95435-6508" },
  { nome: "GIOVANNA DE SOUZA LOPES", cargo: "SENIOR", numero: "11 96346-0070" },
  { nome: "WILLIAM GONCALVES DOS SANTOS", cargo: "SENIOR", numero: "11 99480-6454" },
  { nome: "JOANA ANGELICA DOS SANTOS ARAUJO", cargo: "SENIOR", numero: "11 98872-8801" },
  { nome: "ADNAEL RUBENS DA SILVA SOUSA", cargo: "SENIOR", numero: "11 95176-4180" },
  { nome: "ALESSANDRO LIMA BENJAMIN", cargo: "SENIOR", numero: "11 98029-2812" },
  { nome: "JAMIL LUCIO DA SILVA", cargo: "SENIOR", numero: "11 98189-7607" },
  { nome: "RAFAEL TAVARES FONSECA", cargo: "SENIOR", numero: "12 99222-3632" },
  { nome: "RONALD S TAWAN", cargo: "SENIOR", numero: "11 98915-7227" },
  { nome: "ALINE MARTINS DE CARVALHO", cargo: "SENIOR", numero: "11 94718-4796" },
  { nome: "DELIANE OLIVEIRA (Afastada)", cargo: "SENIOR", numero: "11 98797-8162" },
  { nome: "MAYRANE DOS SANTOS SILVA", cargo: "SENIOR", numero: "11 93147-1952" },
  { nome: "RAVEL KAUAI LIMA MACEDO", cargo: "SENIOR", numero: "11 97777-7781" },
  { nome: "KITIANE PRIMA DA SILVA", cargo: "SENIOR", numero: "11 94501-6775" },
  { nome: "DANILO SANTOS DA SILVA", cargo: "SENIOR", numero: "11 96283-0187" },
  { nome: "TATIANE APARECIDA DE GODOY", cargo: "SENIOR", numero: "11 98856-6552" },
  { nome: "VALERIA CUSTODIO RIBEIRO SAMPAIO", cargo: "SENIOR", numero: "11 96016-3405" },
  { nome: "DAVID JEAN DE MELO PEREIRA", cargo: "SENIOR", numero: "11 95200-2707" },
  { nome: "LUCAS APARECIDO RODRIGUES", cargo: "SENIOR", numero: "11 93146-6673" },
  { nome: "ELIAS LIMA MASCARENHAS", cargo: "SENIOR", numero: "11 93949-6844" },
  { nome: "DANIELLE BRITO SANTOS", cargo: "SENIOR", numero: "11 95489-5086" },
  { nome: "EDENISE SILVA DE MELO", cargo: "SENIOR", numero: "11 98833-2922" },
  { nome: "ELIANE DE OLIVEIRA PEREIRA", cargo: "SENIOR", numero: "11 97872-3138" },
  { nome: "FELIPE LEITE DA SILVA", cargo: "SENIOR", numero: "11 99598-2217" },
  { nome: "ELIANE DOS SANTOS BRITO", cargo: "SENIOR", numero: "11 94591-4466" },
  { nome: "LEANDRO XAVIER", cargo: "SENIOR", numero: "11 95271-6969" },
  { nome: "KELLY CRISTINA LAGARES", cargo: "SENIOR", numero: "11 96529-3797" },
  { nome: "VIVIANE VIEIRA SILVA", cargo: "SENIOR", numero: "11 94773-3677" },
  { nome: "HELENA MORAIS DOS SANTOS FLORES", cargo: "SENIOR", numero: "11 96348-7281" },
  { nome: "MARIA ANNICHELE BOTELHO COELHO", cargo: "SENIOR", numero: "11 99253-5866" },
  { nome: "THALITA REBOUCAS MONZANI", cargo: "SENIOR", numero: "11 99266-0098" },
  { nome: "GILSON ROCHA FRANCA", cargo: "SENIOR", numero: "11 95418-3388" },
  { nome: "VIVIAN AMAZONAS DE OLIVEIRA", cargo: "SENIOR", numero: "11 98973-9403" },
  { nome: "LUIS FERNANDO ALVES FILHO", cargo: "SENIOR", numero: "11 96138-0941" },
  { nome: "SIMONE SILVA DE ALMEIDA", cargo: "SENIOR", numero: "11 99272-7809" },
  { nome: "BRUNO LUIS SANTOS SOUZA", cargo: "SENIOR", numero: "11 94546-7024" },
  { nome: "DIANA COSTA DE MELO", cargo: "SENIOR", numero: "11 99255-9669" },
  { nome: "SIMONE SENA SILVA", cargo: "SENIOR", numero: "11 99488-6644" },
  { nome: "DAVILA DE ARAUJO MATOS", cargo: "SENIOR", numero: "11 96551-0807" },
  { nome: "MARIA DE LOURDES FORTUNATO ROCHA", cargo: "SENIOR", numero: "11 99496-1331" },
  { nome: "BRENA RAYANE DOMINGOS DE SOUSA DIAS", cargo: "SENIOR", numero: "11 95708-3034" },
  { nome: "FERNANDO CARVALHO VIEIRA", cargo: "SENIOR", numero: "11 96590-6300" },
  { nome: "LEANDRO MINELLI", cargo: "SENIOR", numero: "11 99450-3633" },
  { nome: "CASSIA BRANCO FIGUEREDO", cargo: "SENIOR", numero: "11 97076-7078" },
  { nome: "GRAZIELA ARAUJO", cargo: "SENIOR", numero: "11 99101-8383" },
  { nome: "THAMIRES DOS SANTOS FREITAS", cargo: "SENIOR", numero: "11 97047-3528" },
  { nome: "GABRIELA ALVES GUILHERME", cargo: "SENIOR", numero: "11 96582-3950" },
  { nome: "ANE GABRIELE SIQUEIRA", cargo: "SENIOR", numero: "11 93471-2985" },
  { nome: "IGOR ANTONIO DE OLIVEIRA", cargo: "SENIOR", numero: "11 94039-0854" },
  { nome: "VIVIANE ALVES SANTANA", cargo: "SENIOR", numero: "11 96653-8929" },
  { nome: "AMANDA PEREIRA DE JESUS ALVES", cargo: "SENIOR", numero: "11 95252-0357" },
  { nome: "DIEGO MORENO TELES", cargo: "SENIOR", numero: "11 98036-2591" },
  { nome: "EDVALDO BRITO DOS SANTOS", cargo: "SENIOR", numero: "11 97771-5559" },
  { nome: "RAFAEL DE OLIVEIRA SOBRAL", cargo: "SENIOR", numero: "11 96248-2468" },
  { nome: "VOTHAN DA SILVA FELONT", cargo: "SENIOR", numero: "11 94590-8080" },
  { nome: "CAROLINE ANSANELO GOMES", cargo: "SENIOR", numero: "11 97708-4015" },
  { nome: "CARLOS ROBERTO VENTURA", cargo: "SENIOR", numero: "11 98801-2128" },
  { nome: "EDNA DOS SANTOS ANDRADE", cargo: "SENIOR", numero: "11 98596-5002" },
  { nome: "ANA PAULA ALVES DE ALMEIDA", cargo: "SENIOR", numero: "11 95810-6424" },
  { nome: "PATRICIA LUNARDI VICENTE", cargo: "SENIOR", numero: "11 97375-4499" },
  { nome: "ELOIZA CRISTINI (Afastada)", cargo: "SENIOR", numero: "11 94033-3267" },
  { nome: "MAXWELL FERREIRA SILVA", cargo: "SENIOR", numero: "11 93144-3999" },
  { nome: "IGOR CARVALHO DE SOUZA", cargo: "SENIOR", numero: "11 97671-7271" },
  { nome: "MARISA CARVALHO DE ANCHIETA", cargo: "SENIOR", numero: "11 96223-7795" },
  { nome: "THUANI ZAMPIERI ALVES DE OLIVEIRA", cargo: "SENIOR", numero: "11 99132-7708" },
  { nome: "JHONATAS JACOMOLSKI", cargo: "SENIOR", numero: "11 99362-8508" },
  { nome: "GUACIRA CRISTINA NASCIMENTO PEREIRA", cargo: "SENIOR", numero: "11 97627-6664" },
  { nome: "MATHEUS WELLINGTON LIMA DE SOUZA", cargo: "SENIOR", numero: "11 99214-1195" },
  { nome: "GLAUBER INACIO DOS SANTOS", cargo: "SENIOR", numero: "11 96992-1085" },
  { nome: "MAURICIO MENDES SANTOS", cargo: "SENIOR", numero: "11 93337-0185" },
  { nome: "GABRIEL DE LUCENA RIBEIRO", cargo: "SENIOR", numero: "11 93370-3707" },
  { nome: "SALOMAO DE ANDRADE SANTANA", cargo: "SENIOR", numero: "11 99147-1245" },
  { nome: "LEONARDO QUISPE SANTANDER", cargo: "SENIOR", numero: "11 94534-8940" },
  { nome: "PRISCILA GUIMARAES OLIVERIO BASTOS", cargo: "SENIOR", numero: "11 97864-9000" },
  { nome: "JOSE RIDELSIO BEZERRA DA SILVA FILHO", cargo: "SENIOR", numero: "11 94741-1597" },
  { nome: "RHENAN DINIZ DIAS DE SOUZA", cargo: "SENIOR", numero: "11 98111-2001" },
  { nome: "RAFAEL OLIVEIRA SOUZA", cargo: "SENIOR", numero: "11 98707-8077" },
  { nome: "ANA PAULA ALVES DA COSTA", cargo: "SENIOR", numero: "11 99444-9999" },
  { nome: "ELISANGELA REGINA SOMMARIVA", cargo: "SENIOR", numero: "11 99479-1997" },
  { nome: "RAFAEL DIEGO SOUZA PREITE", cargo: "SENIOR", numero: "11 98888-5393" },
  { nome: "LEONICE JOAQUIM DA SILVA (Afastada)", cargo: "SENIOR", numero: "11 94573-9351" },
  { nome: "PAULO CESAR DE ALMEIDA TOLEDO", cargo: "SENIOR", numero: "11 96669-9669" },
  { nome: "NATALIA LUANA DA SILVA", cargo: "SENIOR", numero: "11 98281-4248" },
  { nome: "WILZE ROBERTA PIRES DE CASTRO", cargo: "SENIOR", numero: "11 99295-0000" },
  { nome: "LUCAS VIRGINIO VIEIRA DA SILVA", cargo: "SENIOR", numero: "11 91349-7488" },
  { nome: "KELTON DAVID NUNES DE SOUZA", cargo: "SENIOR", numero: "11 91234-1331" },
  { nome: "GEOVANA MESSIAS DA SILVA (Afastada)", cargo: "SENIOR", numero: "11 99748-1113" },
  { nome: "NATALIA LINS SANTOS", cargo: "SENIOR", numero: "11 96618-0883" },
  { nome: "JAQUELINE CRISTINA DE MORAES OLIVEIRA", cargo: "SENIOR", numero: "11 99825-8467" },
  { nome: "KADSON PICANCO GATO", cargo: "SENIOR", numero: "11 95999-4953" },

  // === GEEK (34) ===
  { nome: "VICTOR PAES", cargo: "GEEK", numero: "11 99251-5100" },
  { nome: "THIAGO GABRIEL", cargo: "GEEK", numero: "11 98650-2431" },
  { nome: "CAIO BRUNO BARNABE", cargo: "GEEK", numero: "11 94047-3957" },
  { nome: "ELISA DE OLIVEIRA DO CARMO", cargo: "GEEK", numero: "11 98963-0960" },
  { nome: "MARINA DE JESUS NEVES", cargo: "GEEK", numero: "11 97777-1507" },
  { nome: "LUIS FERNANDO DE OLIVEIRA FLORINDO JUNIOR", cargo: "GEEK", numero: "13 98194-4987" },
  { nome: "LARISSA CELESTE ZOMPERO SILVA", cargo: "GEEK", numero: "11 93237-7227" },
  { nome: "GUSTAVO HENRI SILVA SALLES", cargo: "GEEK", numero: "11 94793-9676" },
  { nome: "RENNAN ALBUQUERQUE", cargo: "GEEK", numero: "11 94524-4040" },
  { nome: "NICKOLLAS BONCIANI GOMES DO REGO", cargo: "GEEK", numero: "11 97182-6592" },
  { nome: "JOICE APARECIDA SILVA DOS ANJOS", cargo: "GEEK", numero: "11 98664-5095" },
  { nome: "FERNANDO HENRIQUE BATISTA DOS SANTOS", cargo: "GEEK", numero: "11 94827-0745" },
  { nome: "MATHEUS RABELO JAVIER LOPEZ", cargo: "GEEK", numero: "11 98113-1308" },
  { nome: "JONATAS FERNANDES NASCIMENTO", cargo: "GEEK", numero: "11 97552-3219" },
  { nome: "BRUNO SANTOS BONIN", cargo: "GEEK", numero: "11 91486-2070" },
  { nome: "YVES GABRIEL DE SOUZA SILVA", cargo: "GEEK", numero: "11 93355-1994" },
  { nome: "JOÃO HENRIQUE DE SOUZA FEDEL", cargo: "GEEK", numero: "11 98028-1196" },
  { nome: "CLAYTON DA SILVA LUCIANO", cargo: "GEEK", numero: "11 99353-6262" },
  { nome: "WALACE DIEGO DA SILVA", cargo: "GEEK", numero: "11 96336-7007" },
  { nome: "GUSTAVO YUITI MURAKAMI SAITO", cargo: "GEEK", numero: "11 97626-2626" },
  { nome: "LAVINIA CASSEMIRO DE OLIVEIRA", cargo: "GEEK", numero: "11 99475-4668" },
  { nome: "FRANCISCO FELIPE CARVALHO AGUIAR", cargo: "GEEK", numero: "11 93918-8778" },
  { nome: "MAIK RODRIGUES DA CONCEICAO", cargo: "GEEK", numero: "11 98862-4425" },
  { nome: "DAVI LUZ DA SILVA", cargo: "GEEK", numero: "11 98888-7776" },
  { nome: "JOAO VITOR DE SOUZA", cargo: "GEEK", numero: "11 98484-8586" },
  { nome: "GUILHERME AUGUSTO TAVARES BAIRD FERRAZ", cargo: "GEEK", numero: "11 98933-7722" },
  { nome: "VITOR MOREIRA MANTOVA", cargo: "GEEK", numero: "11 94022-8534" },
  { nome: "CLEBERSON FERREIRA NOGUEIRA", cargo: "GEEK", numero: "11 99610-4685" },
  { nome: "WEYDA KATHLEEN RAMOS DE DEUS", cargo: "GEEK", numero: "11 93091-1301" },
  { nome: "BRUNO PIGOSSI DE OLIVEIRA", cargo: "GEEK", numero: "11 97882-8998" },
  { nome: "KAUE DE SOUZA", cargo: "GEEK", numero: "11 94063-8613" },
  { nome: "VINÍCIUS LUIS NIZZOLA GUERREIRO", cargo: "GEEK", numero: "11 97687-3159" },
  { nome: "EDUARDO SILVA VILLELA", cargo: "GEEK", numero: "11 91527-7575" },
  { nome: "RENAN SILVEIRA SILVA", cargo: "GEEK", numero: "11 95918-0052" },

  // === DEMAIS CARGOS DA PLANILHA (COORDENADORES E EQUIPE REGIONAL - 14) ===
  { nome: "DAYANE NOGUEIRA", cargo: "COORDENADOR", numero: "11 99322-4030" },
  { nome: "BRUNA MACHADO", cargo: "COORDENADOR", numero: "11 96608-9002" },
  { nome: "RONALDO MONTEIRO", cargo: "COORDENADOR", numero: "11 94718-1931" },
  { nome: "MANOEL VIEIRA", cargo: "COORDENADOR", numero: "11 98416-3611" },
  { nome: "CAROLINA LOURENÇO", cargo: "COORDENADOR", numero: "11 99402-6562" },
  { nome: "JULIANA GASPAR", cargo: "COORDENADOR", numero: "11 93144-7968" },
  { nome: "TATIANE VEREDA", cargo: "COORDENADOR", numero: "11 94721-5282" },
  { nome: "TABATA DE OLIVEIRA", cargo: "ESPECIALISTA", numero: "11 97690-5072" },
  { nome: "MARINALDO GOMES DOS SANTOS", cargo: "ESPECIALISTA", numero: "11 98505-6575" },
  { nome: "SIMONE CRISTINA MOTTA BATISTELA", cargo: "ANALISTA SÊNIOR", numero: "11 99484-3630" },
  { nome: "CHRISTIANE FARES DOS SANTOS FERNANDES", cargo: "ANALISTA SÊNIOR", numero: "13 99709-6793" },
  { nome: "CLAUDIO MONACO MENDES DE ASSIS", cargo: "ANALISTA SÊNIOR", numero: "11 98129-2290" },
  { nome: "DENISE LOPES DE MATTOS", cargo: "ANALISTA PLENO", numero: "11 97373-7330" },
  { nome: "VIVIANE DA SILVA SOUZA", cargo: "ANALISTA JUNIOR", numero: "11 97277-9558" },
];

export const normalizeName = (name) => {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\(AFASTAD[OA]\)\s*/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
};

export const cleanPhone = (phone) => {
  return String(phone || '').replace(/\D/g, '');
};

export async function initColaboradoresTable() {
  const conn = await getOracleConnection();
  try {
    // 1. Cria a tabela se não existir
    try {
      await conn.execute(`
        CREATE TABLE COLABORADORES_BASE (
          ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          NOME VARCHAR2(200) NOT NULL,
          NOME_NORMALIZADO VARCHAR2(200) NOT NULL,
          CARGO VARCHAR2(60) NOT NULL,
          NUMERO VARCHAR2(30),
          NUMERO_LIMPO VARCHAR2(20),
          EMAIL VARCHAR2(150),
          USERNAME VARCHAR2(100),
          OBSERVACOES VARCHAR2(100),
          STATUS VARCHAR2(30) DEFAULT 'PENDENTE',
          CRIADO_EM TIMESTAMP DEFAULT SYSTIMESTAMP,
          ATUALIZADO_EM TIMESTAMP
        )
      `);
      console.log('✅ Tabela COLABORADORES_BASE criada com sucesso.');
    } catch (e) {
      if (e.errorNum === 955) {
        console.log('ℹ️ Tabela COLABORADORES_BASE já existia.');
      } else {
        throw e;
      }
    }

    // Índices para performance
    const indices = [
      { name: 'IDX_COLAB_NOME_NORM', col: 'NOME_NORMALIZADO' },
      { name: 'IDX_COLAB_NUM_LIMPO', col: 'NUMERO_LIMPO' },
      { name: 'IDX_COLAB_EMAIL', col: 'EMAIL' },
      { name: 'IDX_COLAB_USER', col: 'USERNAME' }
    ];

    for (const idx of indices) {
      try {
        await conn.execute(`CREATE INDEX ${idx.name} ON COLABORADORES_BASE (${idx.col})`);
      } catch (e) {
        // Ignora se o índice já existir
      }
    }

    try {
      await conn.execute(`ALTER SESSION DISABLE PARALLEL DML`);
    } catch(e) {}

    // 2. Popula os colaboradores com MERGE (evita duplicatas e mantém atualizado)
    console.log(`Iniciando inserção/atualização de ${RAW_COLABORADORES.length} colaboradores pré-cadastrados...`);

    let inseridos = 0;

    for (const colab of RAW_COLABORADORES) {
      const norm = normalizeName(colab.nome);
      const phoneDigits = cleanPhone(colab.numero);
      const isAfastado = /afastad[oa]/i.test(colab.nome);
      const obs = isAfastado ? 'Afastado(a)' : null;

      const mergeSql = `
        MERGE INTO COLABORADORES_BASE b
        USING (
          SELECT :norm AS NOME_NORMALIZADO FROM DUAL
        ) src
        ON (b.NOME_NORMALIZADO = src.NOME_NORMALIZADO)
        WHEN MATCHED THEN
          UPDATE SET 
            b.CARGO = :cargo,
            b.NUMERO = :numero,
            b.NUMERO_LIMPO = :numeroLimpo,
            b.OBSERVACOES = NVL(:obs, b.OBSERVACOES),
            b.ATUALIZADO_EM = SYSTIMESTAMP
        WHEN NOT MATCHED THEN
          INSERT (NOME, NOME_NORMALIZADO, CARGO, NUMERO, NUMERO_LIMPO, OBSERVACOES)
          VALUES (:nome, :norm, :cargo, :numero, :numeroLimpo, :obs)
      `;

      const result = await conn.execute(mergeSql, {
        nome: colab.nome,
        norm,
        cargo: colab.cargo,
        numero: colab.numero,
        numeroLimpo: phoneDigits,
        obs
      }, { autoCommit: true });

      if (result.rowsAffected > 0) {
        inseridos++;
      }
    }

    console.log(`✅ Concluído! ${inseridos} colaboradores sincronizados na tabela COLABORADORES_BASE.`);

  } catch (error) {
    console.error('❌ Erro ao inicializar/popular COLABORADORES_BASE:', error);
    await conn.rollback();
    throw error;
  } finally {
    await conn.close();
  }
}

// Se executado diretamente via terminal
if (process.argv[1] && process.argv[1].endsWith('seed_colaboradores.js')) {
  initColaboradoresTable()
    .then(async () => {
      await closeOraclePool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await closeOraclePool();
      process.exit(1);
    });
}
