import { NavigateFunction } from 'react-router-dom';

/**
 * Navigation service to allow navigation from outside React components
 * This solves the problem of calling React Router's navigate from axios interceptors
 */
class NavigationServiceClass {
  private navigate: NavigateFunction | null = null;

  /**
   * Set the navigate function from React Router
   * Call this once from App component after router is initialized
   */
  setNavigate(navigateFunction: NavigateFunction): void {
    this.navigate = navigateFunction;
  }

  /**
   * Navigate to a path with optional state preservation
   * @param path - The path to navigate to
   * @param options - Navigation options including state
   */
  navigateTo(
    path: string,
    options?: {
      replace?: boolean;
      state?: any;
    }
  ): void {
    if (this.navigate) {
      this.navigate(path, options);
    } else {
      // Fallback to window.location if navigate not set
      // This should only happen during initialization
      console.warn('NavigationService: navigate function not set, falling back to window.location');
      window.location.href = path;
    }
  }

  /**
   * Navigate back in history
   */
  goBack(): void {
    if (this.navigate) {
      this.navigate(-1);
    } else {
      window.history.back();
    }
  }

  /**
   * Check if navigate function is set
   */
  isReady(): boolean {
    return this.navigate !== null;
  }
}

export const NavigationService = new NavigationServiceClass();
