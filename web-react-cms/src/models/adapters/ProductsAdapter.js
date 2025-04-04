export class ProductsAdapter {
  static mapProductProviderDtoToProductProviderModel(productProvider) {
    return {
      ...productProvider,
      id: productProvider.id || '',
      name: productProvider.name || '',
      shortName: productProvider.shortName || '',
      logoUrl: productProvider.logoUrl || ''
    };
  }

  static mapProductCategoryDtoToProductCategoryModel(productCategory) {
    return {
      ...productCategory,
      id: productCategory.id || '',
      name: productCategory.name || '',
      iconUrl: productCategory.iconUrl || '',
      tags:
        productCategory.tags.map((tag) => ({
          ...tag,
          type: tag.name.split(' ').join('_').toLowerCase()
        })) || [],
      type: productCategory.name.split(' ').join('_').toLowerCase() || '',
      filter: {
        productFilterQnAs: productCategory.filter.productFilterQnAs || [],
        productFilterRanges: productCategory.filter.productFilterRanges || [],
        productFilterCheckBoxes: productCategory.filter.productFilterCheckBoxes || []
      }
    };
  }

  static mapProductItemDtoToProductItemModel(productItem) {
    return {
      ...productItem,
      id: productItem.id || '',
      categoryId: productItem.categoryId || '',
      providerId: productItem.providerId || '',
      name: productItem.name || '',
      description: productItem.description || '',
      additionalText: productItem.additionalText || '',
      previewFields: productItem.previewFields || '',
      mainFields: productItem.mainFields || [],
      moreFields: productItem.moreFields || [],
      imageUrl: productItem.imageUrl || '',
      thumbnailUrl: productItem.thumbnailUrl || '',
      previewText: productItem.previewText || ''
    };
  }

  static mapProductProviderListDtoToProductProviderListModel(productProvidersList) {
    return productProvidersList.map((productProvider) =>
      this.mapProductProviderDtoToProductProviderModel(productProvider)
    );
  }

  static mapProductCategoryListDtoToProductCategoryListModel(productCategoryList) {
    return productCategoryList.map((productCategory) =>
      this.mapProductCategoryDtoToProductCategoryModel(productCategory)
    );
  }

  static mapProductItemListDtoToProductItemListModel(productItems) {
    return productItems.map((productItem) => this.mapProductItemDtoToProductItemModel(productItem));
  }
}
