import { getServerLL } from '$i18n/idling-server-i18n';
import { withShowcaseCopy } from '@molecules/i18n/idlingShowcaseI18n';
import { resolveProfileCopy } from '@molecules/i18n/idlingMeta';
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
  const profile = await resolveProfileCopy();

  if (!project) {
    return { title: profile.metadata.productNotFoundTitle };
  }

  const ll = getServerLL();
  const localized = withShowcaseCopy(project, ll);

  return {
    title: localized.title,
    description: productMarketingTagline(localized),
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