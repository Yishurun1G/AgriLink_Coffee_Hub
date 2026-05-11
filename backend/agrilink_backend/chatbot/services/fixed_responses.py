def get_fixed_response(message):

    message = message.lower()

    if "how do i register" in message:
        return """
        To register:
        1. Open the registration page
        2. Fill your information
        3. Submit the form
        """

    if "what is agrilink" in message:
        return """
        AgriLink Coffee Hub is a coffee trading
        and management platform.
        """

    return None