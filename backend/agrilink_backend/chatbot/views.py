from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .services.groq_service import ask_gemini
from .services.fixed_responses import get_fixed_response


@api_view(["POST"])
@permission_classes([AllowAny])
def chatbot(request):

    try:

        print("REQUEST RECEIVED")

        message = request.data.get("message")

        print("MESSAGE:", message)

        if not message:
            return Response({
                "error": "Message required"
            }, status=400)

        fixed = get_fixed_response(message)

        print("FIXED RESPONSE:", fixed)

        if fixed:
            return Response({
                "reply": fixed
            })

        print("CALLING GEMINI")

        reply = ask_gemini(message)

        print("GEMINI REPLY:", reply)

        return Response({
            "reply": reply
        })

    except Exception as e:

        print("VIEW ERROR:", str(e))

        return Response({
            "error": str(e)
        }, status=500)