const MUNICIPIOS_URL =
  'https://gerais.defensoria.mg.def.br/unidade/service/integracao/municipio?codigoEstado=031';

const PROCESSOS_URL =
  'https://gerais.defensoria.mg.def.br/cesv/service/estagio/busca-paginada/1-5';

type UnknownRecord = Record<string, unknown>;

export type ConsultarProcessosEstagioParams = {
  uuidMunicipio?: string;
  inicioInscricao?: string;
  finalInscricao?: string;
};

export class LoginObrigatorioError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super('Login obrigatorio para consultar processos seletivos de estagio.');
  }
}

export async function buscarMunicipio(nomeCidade: string) {
  const response = await fetch(MUNICIPIOS_URL, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar municipios.');
  }

  const data = await response.json();
  const municipios = extrairLista(data);
  const termo = normalizarTexto(nomeCidade);

  const candidatos = municipios
    .map((municipio) => ({
      nome: obterCampoTexto(municipio, ['nome', 'nomeMunicipio', 'descricao']),
      uuidMunicipio: obterCampoTexto(municipio, ['uuid', 'uuidMunicipio', 'id']),
      original: municipio,
    }))
    .filter((municipio) => municipio.nome && municipio.uuidMunicipio)
    .filter((municipio) => normalizarTexto(municipio.nome).includes(termo))
    .slice(0, 5);

  if (candidatos.length === 0) {
    return {
      encontrado: false,
      nomeCidade,
      candidatos: [],
    };
  }

  const exato = candidatos.find((municipio) => normalizarTexto(municipio.nome) === termo);
  const melhorResultado = exato ?? candidatos[0];

  return {
    encontrado: true,
    nome: melhorResultado.nome,
    uuidMunicipio: melhorResultado.uuidMunicipio,
    candidatos: candidatos.map(({ nome, uuidMunicipio }) => ({ nome, uuidMunicipio })),
  };
}

export async function consultarProcessosEstagio(
  params: ConsultarProcessosEstagioParams,
  token: string,
) {
  const searchParams = new URLSearchParams();

  searchParams.set('uuidMunicipio', params.uuidMunicipio ?? '');
  searchParams.set('inicioInscricao', params.inicioInscricao ?? '');
  searchParams.set('finalInscricao', params.finalInscricao ?? '');

  const url = `${PROCESSOS_URL}?${searchParams}`;

  console.log('consultarProcessosEstagio:request =>', {
    url,
    params: Object.fromEntries(searchParams),
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const body = await response.text();

  console.log('consultarProcessosEstagio:response =>', {
    status: response.status,
    ok: response.ok,
    body,
  });

  if (response.status !== 200) {
    throw new LoginObrigatorioError(response.status, body);
  }

  return body ? JSON.parse(body) : null;
}

export async function verificarLoginDpmg(token: string) {
  const searchParams = new URLSearchParams({
    uuidMunicipio: '',
    inicioInscricao: '',
    finalInscricao: '',
  });

  const response = await fetch(`${PROCESSOS_URL}?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const body = await response.text();

  console.log('verificarLoginDpmg =>', {
    status: response.status,
    ok: response.ok,
    body,
  });

  return response.status === 200;
}

function extrairLista(data: unknown): UnknownRecord[] {
  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }

  if (!isRecord(data)) {
    return [];
  }

  for (const key of ['content', 'data', 'dados', 'items', 'resultado', 'result']) {
    const value = data[key];

    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  return [];
}

function obterCampoTexto(item: UnknownRecord, campos: string[]) {
  for (const campo of campos) {
    const value = item[campo];

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
  }

  return '';
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function normalizarTexto(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
