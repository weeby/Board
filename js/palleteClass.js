/**
 * Active Board pallete class 
 * @author Krzysztof Wilczek
 * @since 30.09.2011
 */
var Pallete = new Class({
	
	view: null,
	id: null,
	_board: null, // Board reference
	_boxes: [], // Empty array of boxes
	
	Implements: [Options, Events],
	
	options: {
		width: 990,
		height: 50,
		css_class: null
	},

	/**
	 * Object initialization, create new boxes pallete
	 * @param Object element
	 * @param Object options
	 */
	initialize: function(id, board, options)
	{
		if (!id || !board)
		{
			return false;
		}
	
		this.id = id;
		this._board = board;
		
		this.setOptions(options);
		this._render();
	},
	
	/**
	 * Add box to pallete
	 * @param Object box
	 */
	addBox: function(box)
	{
		this._boxes.push(box);
		box._pallete = this;
		box.render();
		this.view.grab(box.view);

	},
	
	/**
	 * Remove box from pallete
	 * @param Object box
	 */
	removeBox: function(box)
	{
		this._boxes.erase(box);
		box.view.dispose();
		box._pallete = null;
	},
	
	/**
	 * Render main active board for boxes
	 */
	_render: function()
	{

		if (this.view)
		{
			this.view.dispose();
			this.view = null;
		}
		this.view = new Element('div', {'class': 'board_pallete '+this.options.css_class});
		
		this.view.setStyles({
			'width': this.options.width,
			'height': this.options.height
		});
		
		this.view.inject(this._board.view, 'before');
	}
});
	