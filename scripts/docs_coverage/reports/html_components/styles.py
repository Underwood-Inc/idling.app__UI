#!/usr/bin/env python3
"""
CSS Styles for HTML Documentation Coverage Report

Provides the main CSS styles for the report.
"""

try:
    from .template_loader import TemplateLoader
except ImportError:
    # Fallback for direct execution
    TemplateLoader = None


def get_css_styles() -> str:
    """Load and return the main CSS styles for the documentation coverage report.
    
    Returns:
        Combined CSS styles as string
    """
    if TemplateLoader is None:
        # If template loader is not available, use fallback styles
        return """
        /* Fallback CSS Styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            color: #edae49;
            margin-bottom: 10px;
        }
        
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 10px;
            text-align: center;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #edae49;
        }
        """
    
    loader = TemplateLoader()
    
    try:
        # Load main CSS file
        main_css = loader.load_style('main.css')
        return main_css
    except FileNotFoundError:
        # Fallback to basic styles if main.css is not found
        return """
        /* Fallback CSS Styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            color: #edae49;
            margin-bottom: 10px;
        }
        
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 10px;
            text-align: center;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #edae49;
        }
        """


# Export the function
__all__ = ['get_css_styles'] 