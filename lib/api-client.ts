/**
 * Client API pour les requêtes HTTP vers le backend ZaLaMa
 */

import { API_CONFIG, getApiUrl, getDefaultHeaders } from '@/config/api';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: HeadersInit;
  accessToken?: string;
  signal?: AbortSignal;
}

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_CONFIG.baseURL) {
    this.baseURL = baseURL;
  }

  /**
   * Effectue une requête HTTP
   */
  async request<T>(
    route: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers: customHeaders,
      accessToken,
      signal,
    } = options;

    const url = getApiUrl(route);
    const headers = {
      ...getDefaultHeaders(accessToken, route),
      ...customHeaders,
    };

    const config: RequestInit = {
      method,
      headers,
      signal,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    // Log pour le débogage (uniquement en développement)
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 Requête API:', {
        method,
        url,
        hasBody: !!body,
        bodyContent: body ? JSON.stringify(body, null, 2) : null,
        hasToken: !!accessToken,
        baseURL: this.baseURL,
        headers: {
          'Content-Type': (headers as Record<string, string>)['Content-Type'],
          'Accept': (headers as Record<string, string>)['Accept'],
          'Authorization': (headers as Record<string, string>)['Authorization'] ? 'Bearer ***' : undefined,
        },
        fullHeaders: headers,
      });
    }

    try {
      // Vérifier que l'URL est valide avant de faire la requête
      if (!url || !url.startsWith('http')) {
        throw new ApiError(
          `URL invalide: ${url}`,
          0,
          { url, baseURL: this.baseURL }
        );
      }

      const response = await fetch(url, config);

      // Vérifier le Content-Type de la réponse
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      // Gérer les erreurs HTTP
      if (!response.ok) {
        let errorData: any;
        
        if (isJson) {
          try {
            errorData = await response.json();
            // Si errorData est vide ou n'a pas de message, créer un message par défaut
            const isEmptyError = !errorData || (typeof errorData === 'object' && Object.keys(errorData).length === 0);
            if (isEmptyError) {
              const defaultMessage = response.status === 404 
                ? `Route non trouvée: ${route}`
                : response.status === 401
                ? 'Non autorisé - Vérifiez votre token d\'accès'
                : response.status === 403
                ? 'Accès refusé'
                : response.status === 500
                ? 'Erreur serveur interne'
                : `Erreur HTTP ${response.status}: ${response.statusText}`;
              
              errorData = {
                statusCode: response.status,
                message: defaultMessage,
                error: 'Request Failed',
                originalResponse: 'Empty JSON response',
              };
            }
            // Log pour le débogage
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ Erreur API (JSON):', {
                status: response.status,
                statusText: response.statusText,
                route,
                url,
                method,
                isEmptyResponse: isEmptyError,
                errorData: isEmptyError ? errorData : errorData,
                errorMessage: errorData.message || 'Aucun message d\'erreur',
                fullError: JSON.stringify(errorData, null, 2),
              });
            }
          } catch (parseError) {
            errorData = {
              statusCode: response.status,
              message: response.statusText || 'Erreur lors du parsing de la réponse',
              error: 'Request Failed',
            };
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ Erreur lors du parsing JSON de l\'erreur:', {
                status: response.status,
                route,
                url,
                parseError,
              });
            }
          }
        } else {
          // Si ce n'est pas du JSON, c'est probablement une page HTML d'erreur
          const text = await response.text();
          console.error('❌ Le serveur a retourné du HTML au lieu de JSON:', {
            url,
            status: response.status,
            statusText: response.statusText,
            contentType,
            preview: text.substring(0, 200),
          });
          
          errorData = {
            statusCode: response.status,
            message: response.status === 404 
              ? `Route non trouvée: ${url}` 
              : `Le serveur a retourné une réponse non-JSON (${contentType || 'unknown'})`,
            error: 'Invalid Response',
          };
        }

        throw new ApiError(
          errorData.message || 'Une erreur est survenue',
          response.status,
          errorData
        );
      }

      // Vérifier que la réponse est bien du JSON
      if (!isJson) {
        const text = await response.text();
        console.error('❌ Le serveur a retourné du HTML au lieu de JSON:', {
          url,
          status: response.status,
          contentType,
          preview: text.substring(0, 500),
        });
        
        // Si c'est du HTML, c'est probablement une erreur 404 ou un problème de routage
        let errorMessage = `Le serveur a retourné une réponse non-JSON (${contentType || 'unknown'})`;
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          errorMessage = `L'API a retourné une page HTML au lieu de JSON. Vérifiez que l'URL est correcte: ${url}`;
          if (text.includes('404') || url.includes('localhost')) {
            errorMessage += ' (Route non trouvée ou problème de configuration)';
          }
        }
        
        throw new ApiError(
          errorMessage,
          response.status || 0,
          { url, contentType, preview: text.substring(0, 500) }
        );
      }

      // Parser la réponse JSON
      let data: T;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text().catch(() => 'Impossible de lire la réponse');
        console.error('❌ Erreur lors du parsing JSON:', {
          url,
          parseError,
          preview: text.substring(0, 200),
        });
        throw new ApiError(
          `Erreur lors du parsing de la réponse JSON: ${parseError instanceof Error ? parseError.message : 'Erreur inconnue'}`,
          response.status,
          { url, preview: text.substring(0, 200) }
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Erreur réseau ou autre
      const errorMessage = error instanceof Error ? error.message : 'Erreur réseau';
      console.error('❌ Erreur lors de la requête API:', {
        url,
        error: errorMessage,
        errorObject: error,
      });
      
      throw new ApiError(
        errorMessage,
        0,
        error
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(route: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(route, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(route: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(route, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T>(route: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(route, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T>(route: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(route, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T>(route: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(route, { ...options, method: 'PATCH', body });
  }
}

/**
 * Classe d'erreur personnalisée pour l'API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Instance singleton du client API
 */
export const apiClient = new ApiClient();

