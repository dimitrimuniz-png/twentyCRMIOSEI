import { type ApiType } from 'src/engine/core-modules/usage/types/api-type.type';

export const getApiTypeFromPath = (path: string): ApiType | undefined => {
  if (path === '/graphql' || path.startsWith('/graphql/')) {
    return 'CORE_GQL';
  }

  if (path === '/mcp' || path.startsWith('/mcp/')) {
    return 'MCP';
  }

  if (path === '/rest' || path.startsWith('/rest/')) {
    return 'CORE_REST';
  }

  return undefined;
};
