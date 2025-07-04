#!/usr/bin/env python3
"""
Template Loader for HTML Components

Loads HTML templates and CSS files from the file system to avoid inline content.
"""

import os
from pathlib import Path
from typing import Dict, Optional


class TemplateLoader:
    """Loads HTML templates and CSS files from the file system."""
    
    def __init__(self, base_path: Optional[Path] = None):
        """Initialize the template loader.
        
        Args:
            base_path: Base path for templates. Defaults to current file's directory.
        """
        if base_path is None:
            base_path = Path(__file__).parent
        
        self.base_path = base_path
        self.templates_dir = base_path / "templates"
        self.styles_dir = base_path / "styles"
        self.scripts_dir = base_path / "scripts"
        
        # Cache for loaded templates
        self._template_cache: Dict[str, str] = {}
        self._style_cache: Dict[str, str] = {}
        self._script_cache: Dict[str, str] = {}
    
    def load_template(self, template_name: str) -> str:
        """Load an HTML template from the templates directory.
        
        Args:
            template_name: Name of the template file (e.g., 'base.html')
            
        Returns:
            Template content as string
        """
        if template_name in self._template_cache:
            return self._template_cache[template_name]
        
        template_path = self.templates_dir / template_name
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")
        
        with open(template_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        self._template_cache[template_name] = content
        return content
    
    def load_style(self, style_name: str) -> str:
        """Load a CSS file from the styles directory.
        
        Args:
            style_name: Name of the CSS file (e.g., 'main.css')
            
        Returns:
            CSS content as string
        """
        if style_name in self._style_cache:
            return self._style_cache[style_name]
        
        style_path = self.styles_dir / style_name
        if not style_path.exists():
            raise FileNotFoundError(f"Style not found: {style_path}")
        
        with open(style_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        self._style_cache[style_name] = content
        return content
    
    def load_script(self, script_name: str) -> str:
        """Load a JavaScript file from the scripts directory.
        
        Args:
            script_name: Name of the JS file (e.g., 'main.js')
            
        Returns:
            JavaScript content as string
        """
        if script_name in self._script_cache:
            return self._script_cache[script_name]
        
        script_path = self.scripts_dir / script_name
        if not script_path.exists():
            raise FileNotFoundError(f"Script not found: {script_path}")
        
        with open(script_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        self._script_cache[script_name] = content
        return content
    
    def render_template(self, template_name: str, **kwargs) -> str:
        """Render a template with variable substitution.
        
        Args:
            template_name: Name of the template file
            **kwargs: Variables to substitute in the template
            
        Returns:
            Rendered template content
        """
        template = self.load_template(template_name)
        
        # Simple template variable substitution
        for key, value in kwargs.items():
            placeholder = f"{{{{{key}}}}}"
            template = template.replace(placeholder, str(value))
        
        return template
    
    def get_inline_styles(self) -> str:
        """Get all CSS styles as inline <style> tags.
        
        Returns:
            Combined CSS wrapped in <style> tags
        """
        styles = []
        
        # Load all CSS files
        css_files = ['main.css', 'table.css', 'modals.css']
        for css_file in css_files:
            try:
                css_content = self.load_style(css_file)
                styles.append(css_content)
            except FileNotFoundError:
                # Skip missing files
                continue
        
        if not styles:
            return ""
        
        return f"<style>\n{chr(10).join(styles)}\n</style>"
    
    def get_inline_scripts(self) -> str:
        """Get all JavaScript as inline <script> tags.
        
        Returns:
            Combined JavaScript wrapped in <script> tags
        """
        scripts = []
        
        # Load all JS files
        js_files = ['main.js']
        for js_file in js_files:
            try:
                js_content = self.load_script(js_file)
                scripts.append(js_content)
            except FileNotFoundError:
                # Skip missing files
                continue
        
        if not scripts:
            return ""
        
        return f"<script>\n{chr(10).join(scripts)}\n</script>"
    
    def clear_cache(self):
        """Clear all cached templates and styles."""
        self._template_cache.clear()
        self._style_cache.clear()
        self._script_cache.clear() 