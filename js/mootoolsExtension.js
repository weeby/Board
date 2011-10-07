/**
 * Standard Mootools Elements extension
 * add new mathod called getLayout who return layout sizes 
 * @return Object
 */
Element.implement('getLayout', function() {
	
	function getLayoutDimensions(element, type)
	{
	
		if (!element)
		{
			return false;
		}
		if (!(['left', 'top', 'right', 'bottom'].contains(type)))
		{
			return false;
		}
		
		return parseInt(element.getStyle('padding-'+type), 10) + parseInt(element.getStyle('margin-'+type), 10) + parseInt(element.getStyle('border-'+type+'-width'), 10);
	}
	
	var sizes = {
		'width': parseInt(this.getStyle('width'), 10),
		'height': parseInt(this.getStyle('height'),10),
		'layout_left': getLayoutDimensions(this, 'left'),
		'layout_right': getLayoutDimensions(this, 'right'),
		'layout_top': getLayoutDimensions(this, 'top'),
		'layout_bottom': getLayoutDimensions(this, 'bottom')
	}
	
	sizes.layout_vertical = sizes.layout_top + sizes.layout_bottom;
	sizes.layout_horizontal = sizes.layout_left + sizes.layout_right;
	
	return sizes;
	
});