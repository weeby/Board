/**
 * Active Board Box class
 * @author Krzysztof Wilczek
 * @since 30.09.2011
 * 
 * Options:
 * 		Boolean	resizable				- Make box resizable
 * 		Boolean moveable				- Make box moveable via drag & drop method	
 * 		String	html					- HTML content of the box
 * 		String	related_to_box			- Id of related box (on resize will auto resize related box)
 * 
 * 		Object	dimensions	
 * 			Int	width					- Box width in grid scale
 * 			Int	height					- Box height in grid scale 
 * 			Int	top						- Box top position in grid scale
 * 			Int left					- Box distance from left in grid scale
 * 
 * 		Object	resize
 * 			String	modifier_x			- What property of object will be changed on x resize action
 * 			String	modifier_y			- What property of object will be changed on y resize action
 * 			Int		minimal_width		- Minimal object width in grid scale
 * 			Int		minimal_height		- Minimal box height in grid scale
 * 			Int		maximal_width		- Maximal box width in grid scale
 * 			Int		maximal_height		- Maximal box height in grid scale
 * 			Int		jump_width			- Width jump during resize action in grid scale
 * 			Int		jump_height			- Height jump during resize action in grid scale
 * 
 * 		String	css_class				- Name of css class of the box
 * 		String	out_of_board_class		- Name of css class added when box is moved out of board
 * 
 * 		Function	onCreate			- Fired after box creation
 * 		Function	onResize			- Fired after box resize action (with new dimensions)
 * 		Function	onDrop				- Fired after box new position selection (with new dimensions)
 * 		Function	onDestroy			- Fired before view dispose		
 * 		Function	onDropfieldEnter	- Fired when box is moved over drop field (board)
 * 		Function	onDropfieldLeave	- Fired when box is moved out of drop field (board)
 */
var Box = new Class({
	
	id: null,
	_board: null, // Reference to active board object
	_pallete: null, // Reference to pallete holding box
	view: null, 
	
	
	Implements: [Options, Events],
	
	options: {
		resizable: true, // Is box resizable
		moveable: true, // Is box moveable
		html: null, // Box content
		name: 'Box name', // Box name
		related_to_box: null, // Box sizes related to box (by box id)
		
		// Object grid dimensions
		dimensions: {
			width: 9,
			height: 9,
			top: 0,
			left: 0				
		},
		
		// Object resize properties
		resize: {
			modifier_x: 'width',
			modifier_y: 'height',
			minimal_width: 9,
			minimal_height: 9,
			maximal_width: 18,
			maximal_height: 18,
			jump_width: 1,
			jump_height: 9
		},
		
		css_class: null,
		out_of_board_class: 'box_out_of_board'
	},

	/**
	 * Object initilization, create new box and bind it to board
	 */
	initialize: function(id, board, options)
	{
		if (!id || !board)
		{
			return false;
		}
		this._board = board;
		this.id = id;
		
		this.setOptions(options);
		this.render(); // Render box
		
		this.fireEvent('create', this);
		
	},
	
	/**
	 * Render box putted into boxes pallete
	 */
	_renderOnPallete: function()
	{
		var box_div = new Element('div', {
			id: this.id,
			html: this.options.name,
			'class': 'pallete_box '+this.options.css_class
		});
		return box_div;
	},
	
	/**
	 * Render boxes putted on board
	 */
	_renderOnBoard: function()
	{
		// Create box div
		var box_div = new Element('div', {
			id : this.id, 
			html: this.options.html, 
			'class': 'board_box '+this.options.css_class
		});
		
		// Create resize hanlder
		if (this.options.resizable)
		{
			var resize_div = new Element('div', {'class': 'resize_handler'});
			box_div.grab(resize_div);	
		}
		
		// Set right width and height in grid scale
		var grid = this._board.options.grid_size;
		
		box_div.setStyles({
			'width': (this.options.dimensions.width * grid),
			'height': (this.options.dimensions.height * grid)
		});
		
		return box_div;
	},
	
	/**
	 * Create new box layout and after that setts box dimensions
	 */
	render: function()
	{
		if (this._pallete)
		{	
			this.view = this._renderOnPallete();
		}
		else
		{
			this.view = this._renderOnBoard();
			this._setDimensions();
		}

		this._makeResizable(); // Make box resizable
		this._makeMoveable(); // Make box movable
	},
	
	/**
	 * Event triged on box resize
	 * @param Object element
	 * @param Object event
	 */
	onResize: function(element, event)
	{
		// Get element dimensions related to grid
		var new_dimensions = this._getElementDimensions(element, true); 

		// Calculate width and height resize jump
		new_dimensions.height = Math.round(new_dimensions.height / this.options.resize.jump_height) * this.options.resize.jump_height;
		new_dimensions.width = Math.round(new_dimensions.width / this.options.resize.jump_width) * this.options.resize.jump_width;
		if (new_dimensions.height > this.options.resize.maximal_height)
		{
			new_dimensions.height = this.options.resize.maximal_height;
		}
		if (new_dimensions.height < this.options.resize.minimal_height)
		{
			new_dimensions.height = this.options.resize.minimal_height;
		}
		if (new_dimensions.width > this.options.resize.maximal_width)
		{
			new_dimensions.width = this.options.resize.maximal_width;
		}
		if (new_dimensions.width < this.options.resize.minimal_width)
		{
			new_dimensions.width = this.options.resize.minimal_width;
		}
		
		// Check if new dimensions are correct grid dimensions 
		if (!this._board.checkBoxNewDimensions(this, new_dimensions))
		{
			this._setDimensions();
		}
		else
		{	
			// Correct related box dimensions
			if (this.options.related_to_box)
			{
				this._board.correctBoxDimensions(this.options.related_to_box, this._calculateDimensionsDifference(this.options.dimensions, new_dimensions));
			}
			// Set new dimensions
			this._setDimensions(new_dimensions);		
		}
	
		this.fireEvent('resize', this);
	},
		
	/**
	 * Set box style dimensions from options properties or as user define
	 * @param Object dimensions
	 */
	_setDimensions: function(dimensions)
	{
		var grid = this._board.options.grid_size;
		if (!dimensions)
		{
			dimensions = this.options.dimensions; 
		}
		else
		{
			this.options.dimensions = dimensions;
		}
		this._setElementDimensionsOnGrid(this.view, dimensions);
	},
	
	/**
	 * Getting element dimensions related or not to grid sizes
	 * @param Object element (DOM element or dimensions element)
	 * @param Boolean on_grid 
	 * @return Object
	 */
	_getElementDimensions: function(element, on_grid)
	{
		if (element.style)
		{
			element = element.style;
		}
		
		if (on_grid)
		{
			var grid = this._board.options.grid_size;
			return {
				'width': Math.round(parseInt(element.width, 10) / grid),
				'height': Math.round(parseInt(element.height, 10) / grid),
				'left': Math.round(parseInt(element.left, 10) / grid),
				'top': Math.round(parseInt(element.top, 10) / grid)
			};
		}
		else
		{
			return {
				'width': parseInt(element.width, 10),
				'height': parseInt(element.height, 10),
				'left': parseInt(element.left, 10),
				'top': parseInt(element.top, 10) 
			};
		}
	},
	
	/**
	 * Calculate difference beatween new and old dimensions
	 * @param Object start_dimensions
	 * @param Object end_dimensions
	 * @return Object 
	 */
	_calculateDimensionsDifference: function(start_dimensions, end_dimensions)
	{
		if (!start_dimensions || !end_dimensions)
		{
			return false;
		}
		return {
			'left': end_dimensions.left - start_dimensions.left,
			'top': end_dimensions.top - start_dimensions.top,
			'width': end_dimensions.width - start_dimensions.width,
			'height': end_dimensions.height - start_dimensions.height
		};
	},

	/**
	 * Calculate dimensions on grid for selected element
	 * @param Object Element
	 * @return Object 
	 */
	_calculateDimensionsOnGrid: function(element)
	{
		if (!element)
		{
			return null;
		}
		var drag_coordinates = element.getCoordinates();
		var drop_coordinates = this._board.view.getCoordinates();

		var box_layout = element.getLayout();
		var board_layout = this._board.view.getLayout();
	
		var dimensions = {
			'left': drag_coordinates.left - box_layout.layout_horizontal - (drop_coordinates.left - board_layout.layout_horizontal),
			'top': drag_coordinates.top - box_layout.layout_vertical - (drop_coordinates.top - board_layout.layout_vertical) ,
			'width': drag_coordinates.width,
			'height': drag_coordinates.height,
		};
		dimensions = this._getElementDimensions(dimensions, true);
		
		return dimensions;
		
	},
	
	/**
	 * Set elements selected dimensions 
	 * @param Object element
	 * @param Object dimensions
	 */
	_setElementDimensionsOnGrid: function(element, dimensions)
	{
		var grid = this._board.options.grid_size;
		element.setStyles({
			'width': dimensions.width * grid + 'px',
			'height': dimensions.height * grid + 'px',
			'left': dimensions.left * grid + 'px',
 			'top': dimensions.top * grid + 'px'
		});
	},
	
	/**
	 * Setting dimensions related to grid on selected element
	 * @param Object element
	 * @param Object dimensions
	 */
	_setElementDimensionsRelatedToGrid: function(element, dimensions)
	{
		if (!element || !dimensions)
		{
			return null;
		}
		var grid = this._board.options.grid_size;
	
		element.setStyles({
			'left': (Math.round(parseInt(dimensions.left,10) / grid) * grid)  + 'px',
			'top': (Math.round(parseInt(dimensions.top,10) / grid) * grid)  + 'px',
			'width': Math.round(parseInt(dimensions.width,10) / grid) * grid + 'px',
			'height': Math.round(parseInt(dimensions.height,10) / grid) * grid + 'px'
		});
			
		return element;
	},
	
	/**
	 * Making box resizable if possible
	 */
	_makeResizable: function()
	{
		if (!this.options.resizable || !(this.view.getFirst('div.resize_handler')))
		{
			return false;
		}
	
		var grid = this._board.options.grid_size;
		var limits = {};

		// Caculate resize limits
		if (this.options.resize.maximal_width && this.options.resize.minimal_width)
		{			
			limits.x = [this.options.resize.minimal_width * grid, this.options.resize.maximal_width * grid];	
		}
		if (this.options.resize.maximal_height && this.options.resize.minimal_height)
		{
			limits.y = [this.options.resize.minimal_height * grid, this.options.resize.maximal_height * grid];
		}

		// Add resize controll to element
		var box_resizer = this.view.makeResizable({
			grid: this._board.options.grid_size,
			handle: this.view.getFirst('div.resize_handler'),
			limit: limits,
			modifiers: {x: this.options.resize.modifier_x, y: this.options.resize.modifier_y}, 
			onDrag: this.onResize.bind(this)
		});
		this.view.store(box_resizer);
					
	},
	
	/**
	 * Box was been moved and droped somewhere
	 * @param Object drag
	 * @param Object drop
	 */
	onBoxDrop: function(drag, drop)
	{
		// Drop on drop field
		if (drop)
		{	
			// Drop box inserted in pallete
			if (this._pallete)
			{
				// Move form pallete to board if possible
				var new_dimensions = this._calculateDimensionsOnGrid(drag);
				if (this._board.checkBoxNewDimensions(this, new_dimensions))
				{
					this._pallete.removeBox(this);
					this._board._boxes.push(this);
					this.render();
					this._board.view.grab(this.view);
					this._setDimensions(new_dimensions);	
				}
			}
			else
			{
				// Normaly drop box
				var new_dimensions = this._getElementDimensions(drag, true);
				this._setDimensions(new_dimensions);	
			}
			
			this.view.fade('in');	
		}
		// Droped out of board
		else
		{
			this._board.moveToPallete(this);
		}
		drag.dispose();
		
		this.fireEvent('drop', this);
	},
	
	/**
	 * Box dragging over right fields
	 * @param Object drag
	 */
	onBoxDrag: function(drag, event)
	{	
		if (this._is_over_drop)
		{
			if (this._pallete)
			{
				
				// Get dimensions related to body and to grid
				var body_dimensions = this._getElementDimensions(drag, false);
				var grid_dimensions = this._calculateDimensionsOnGrid(drag);
				
				// Validate grid dimensions
				if (!this._board.checkBoxNewDimensions(this, grid_dimensions))
				{
					
					var old_dimensions = drag.retrieve('old_body_dimensions');
					if (!old_dimensions)
					{
						this._setElementDimensionsRelatedToGrid(drag, old_dimensions);	
					}
				}
				else
				{
					// Correct drag position related to grid
					this._setElementDimensionsRelatedToGrid(drag, body_dimensions);
					drag.store('old_body_dimensions', body_dimensions);
				}
			}
			else
			{
				// Get position of drag element on grid
				var new_dimensions = this._getElementDimensions(drag, true);
		
				// Check if new position is correct
				if (!this._board.checkBoxNewDimensions(this, new_dimensions))
				{
					// Get and set old dimensions
					this._setElementDimensionsOnGrid(drag, drag.retrieve('old_dimensions'));
				}
				else
				{
					// Set new dimensions
					this._setElementDimensionsOnGrid(drag, new_dimensions);
					drag.store('old_dimensions', new_dimensions);
				}
			
			}
		}
	},
	
	/**
	 * Box entered over drop field
	 * @param Object drag
	 * @param Object drop
	 */
	onBoxEnter: function(drag, drop)
	{
		this._is_over_drop = true;
		drag.removeClass(this.options.out_of_board_class);
		this.fireEvent('onDropfieldEnter', this);
	},
	
	/**
	 * Box leave drop field
	 * @param Object drag
	 * @param Object drop
	 */
	onBoxLeave: function(drag, drop)
	{
		this._is_over_drop = false;
		drag.addClass(this.options.out_of_board_class);
		this.fireEvent('onDropfieldLeave', this);
	},
	
	/**
	 * Make box movable via drag and drop if possible
	 */
	_makeMoveable: function()
	{
		
		if (!this.options.moveable)
		{
			return false;
		}

		this.view.addEvent('mousedown', function(event) {
			
			// Blockin drag and drop event if clicked on resize handler
			if ((event.target.hasClass('resize_handler')) || event.rightClick)
			{
				return;
			}
			event = new Event(event).stop();
			if (this._pallete)
			{
				var view = this._renderOnBoard(); 
			}
			else
			{
				var view = this.view;
			}
	
			// Make clone of HTML object		
			var clone = view.clone(); 
			clone.addClass('clone_box');
			clone_id = 'clone_'+this.id;
			clone.set('id', clone_id);
			clone.inject(this.view, 'before');
			clone.store('old_dimensions', this._getElementDimensions(clone, true));

			// Hide board box
			this.view.setStyle('opacity', 0);
			
			// Add drag and drop controll
			var box_mover = clone.makeDraggable({
				droppables: this._board.view,
	
				onDrop: this.onBoxDrop.bind(this),
				onDrag: this.onBoxDrag.bind(this),
				onEnter: this.onBoxEnter.bind(this),
				onLeave: this.onBoxLeave.bind(this)
			});
			
			box_mover.start(event);
		}.bind(this));	
	},
	
	/**
	 * Destroy box interface
	 */
	destroy: function()
	{
		this.fireEvent('destroy');
		this.view.dispose();
		this.view = null;
	}
});
	