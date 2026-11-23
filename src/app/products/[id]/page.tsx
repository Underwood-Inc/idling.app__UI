import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductMarketingDetail } from '../../components/marketing-dashboard/ProductMarketingDetail';
import {
  getProductMarketingProject,
  listProductMarketingIds,
  productMarketingTagline,
} from '../../components/marketing-dashboard/productMarketing';
import { PageContainer } from '../../components/page-container/PageContainer';

interface ProductPageParams {
  id: string;
}

interface ProductPageProps {
  params: Promise<ProductPageParams>;
}

export function generateStaticParams(): ProductPageParams[] {
  return listProductMarketingIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = getProductMarketingProject(id);

  if (!project) {
    return { title: 'Product' };
  }

  return {
    title: project.title,
    description: productMarketingTagline(project),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const project = getProductMarketingProject(id);

  if (!project) {
    notFound();
  }

  return (
    <PageContainer>
      <ProductMarketingDetail project={project} />
    </PageContainer>
  );
}