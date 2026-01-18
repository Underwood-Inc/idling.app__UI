/**
 * ProductMarketingTemplate - Clean, professional marketing page template
 * 
 * This template provides a consistent structure for all product marketing pages.
 * NO interactive demos - pure marketing content only.
 */

import { ReactNode } from 'react';
import './ProductMarketingTemplate.css';

export interface ProductFeature {
  icon: string;
  title: string;
  description: string;
  highlights?: string[];
}

export interface ProductLink {
  label: string;
  url: string;
  variant: 'primary' | 'secondary' | 'github' | 'external';
  icon?: string;
}

export interface ProductMarketingProps {
  // Hero Section
  title: string;
  tagline: string;
  description: string;
  heroIcon?: string;
  
  // Features Section
  features: ProductFeature[];
  
  // Links/CTAs
  links: ProductLink[];
  
  // Optional Sections
  techStack?: string[];
  stats?: { label: string; value: string; icon?: string }[];
  testimonial?: { quote: string; author: string; role?: string };
  
  // Additional Content
  children?: ReactNode;
}

export function ProductMarketingTemplate({
  title,
  tagline,
  description,
  heroIcon,
  features,
  links,
  techStack,
  stats,
  testimonial,
  children
}: ProductMarketingProps) {
  return (
    <div className="product-marketing">
      {/* Hero Section */}
      <section className="product-marketing__hero">
        {heroIcon && <div className="product-marketing__hero-icon">{heroIcon}</div>}
        <h1 className="product-marketing__title">{title}</h1>
        <p className="product-marketing__tagline">{tagline}</p>
        <p className="product-marketing__description">{description}</p>
        
        {/* Primary CTAs */}
        <div className="product-marketing__ctas">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              className={`product-marketing__cta product-marketing__cta--${link.variant}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.icon && <span className="product-marketing__cta-icon">{link.icon}</span>}
              {link.label}
            </a>
          ))}
        </div>
      </section>

      {/* Stats Section (if provided) */}
      {stats && stats.length > 0 && (
        <section className="product-marketing__stats">
          {stats.map((stat, index) => (
            <div key={index} className="product-marketing__stat">
              {stat.icon && <span className="product-marketing__stat-icon">{stat.icon}</span>}
              <div className="product-marketing__stat-value">{stat.value}</div>
              <div className="product-marketing__stat-label">{stat.label}</div>
            </div>
          ))}
        </section>
      )}

      {/* Features Section */}
      <section className="product-marketing__features">
        <h2 className="product-marketing__section-title">Key Features</h2>
        <div className="product-marketing__features-grid">
          {features.map((feature, index) => (
            <div key={index} className="product-marketing__feature">
              <div className="product-marketing__feature-icon">{feature.icon}</div>
              <h3 className="product-marketing__feature-title">{feature.title}</h3>
              <p className="product-marketing__feature-description">{feature.description}</p>
              {feature.highlights && feature.highlights.length > 0 && (
                <ul className="product-marketing__feature-highlights">
                  {feature.highlights.map((highlight, hIndex) => (
                    <li key={hIndex}>{highlight}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack Section (if provided) */}
      {techStack && techStack.length > 0 && (
        <section className="product-marketing__tech-stack">
          <h2 className="product-marketing__section-title">Built With</h2>
          <div className="product-marketing__tech-tags">
            {techStack.map((tech, index) => (
              <span key={index} className="product-marketing__tech-tag">
                {tech}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Testimonial Section (if provided) */}
      {testimonial && (
        <section className="product-marketing__testimonial">
          <blockquote className="product-marketing__quote">
            &ldquo;{testimonial.quote}&rdquo;
          </blockquote>
          <div className="product-marketing__testimonial-author">
            <strong>{testimonial.author}</strong>
            {testimonial.role && <span> &mdash; {testimonial.role}</span>}
          </div>
        </section>
      )}

      {/* Custom Content Section */}
      {children && (
        <section className="product-marketing__custom">
          {children}
        </section>
      )}
    </div>
  );
}
